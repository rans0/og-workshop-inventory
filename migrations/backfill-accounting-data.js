#!/usr/bin/env node

/**
 * Backfill Script: Populate accounting columns for existing transactions
 *
 * This script calculates and fills in:
 * - price: The item price at time of transaction
 * - running_qty: Cumulative quantity balance after each transaction
 * - running_value: Cumulative value balance after each transaction
 * - avg_price: Average cost per unit after each transaction (running_value / running_qty)
 *
 * Usage:
 *   node migrations/backfill-accounting-data.js [--local] [--remote]
 *
 * Options:
 *   --local   Run against local database (default)
 *   --remote  Run against production Cloudflare D1
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration from wrangler.toml
const DB_NAME = 'workshop-inventory-db';
const LOCAL_DB_PATH = '.wrangler/state/v3/d1/miniflare-D1DatabaseObject';

// ANSI color codes
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
    console.log('');
    log('═'.repeat(60), 'cyan');
    log(`  ${title}`, 'cyan');
    log('═'.repeat(60), 'cyan');
}

// Execute SQL query via wrangler
function executeQuery(sql, isLocal = true) {
    const flag = isLocal ? '--local' : '--remote';
    const tmpFile = path.join(__dirname, '.tmp_query.sql');

    try {
        // Write SQL to temp file
        fs.writeFileSync(tmpFile, sql);

        // Execute via wrangler
        const output = execSync(
            `npx wrangler d1 execute ${DB_NAME} ${flag} --file=${tmpFile}`,
            { encoding: 'utf-8', stdio: 'pipe' }
        );

        // Parse JSON output if possible
        try {
            const jsonMatch = output.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
        } catch (e) {
            // Not JSON, return as-is
        }

        return output;
    } catch (error) {
        throw new Error(`Query failed: ${error.message}`);
    } finally {
        if (fs.existsSync(tmpFile)) {
            fs.unlinkSync(tmpFile);
        }
    }
}

// Get all items from database
function getAllItems(isLocal = true) {
    logSection('Fetching All Items');

    const sql = `
        SELECT id, code, name, price
        FROM items
        WHERE is_deleted = 0 OR is_deleted IS NULL
        ORDER BY code
    `;

    const result = executeQuery(sql, isLocal);

    if (result.success && result.results) {
        return result.results;
    }

    throw new Error('Failed to fetch items');
}

// Get all transactions for an item, ordered by date
function getTransactionsForItem(itemId, isLocal = true) {
    const sql = `
        SELECT
            t.id,
            t.item_id,
            t.type,
            t.quantity,
            t.notes,
            t.created_at,
            i.price as item_price
        FROM transactions t
        LEFT JOIN items i ON t.item_id = i.id
        WHERE t.item_id = '${itemId}'
        ORDER BY t.created_at ASC
    `;

    const result = executeQuery(sql, isLocal);

    if (result.success && result.results) {
        return result.results;
    }

    return [];
}

// Update a single transaction with accounting values
function updateTransaction(txId, accountingData, isLocal = true) {
    const sql = `
        UPDATE transactions
        SET price = ${accountingData.price},
            running_qty = ${accountingData.running_qty},
            running_value = ${accountingData.running_value},
            avg_price = ${accountingData.avg_price}
        WHERE id = '${txId}'
    `;

    executeQuery(sql, isLocal);
}

// Calculate and update accounting data for all transactions of an item
function processItem(item, isLocal = true) {
    const transactions = getTransactionsForItem(item.id, isLocal);

    if (transactions.length === 0) {
        log(`  No transactions for ${item.code} - ${item.name}`, 'yellow');
        return { updated: 0, skipped: 0 };
    }

    let runningQty = 0;
    let runningValue = 0;
    let avgPrice = 0;
    let updatedCount = 0;

    for (const tx of transactions) {
        // Use item_price at time of query (fallback for historical data)
        const price = tx.item_price || 0;
        const qtyDelta = tx.type === 'IN' ? tx.quantity : -tx.quantity;
        const valueDelta = qtyDelta * price;

        runningQty += qtyDelta;
        runningValue += valueDelta;
        avgPrice = runningQty !== 0 ? runningValue / runningQty : 0;

        // Update transaction
        updateTransaction(tx.id, {
            price: price,
            running_qty: runningQty,
            running_value: runningValue,
            avg_price: avgPrice,
        }, isLocal);

        updatedCount++;
    }

    log(`  ${item.code}: Updated ${updatedCount} transactions`, 'green');
    log(`    → Final: ${runningQty} pcs @ ${avgPrice.toFixed(2)} = ${runningValue.toFixed(2)}`, 'blue');

    return { updated: updatedCount, skipped: 0 };
}

// Main execution
async function main() {
    const args = process.argv.slice(2);
    const isLocal = !args.includes('--remote');
    const isRemote = args.includes('--remote');

    logSection('Accounting Data Backfill Script');
    log(`Mode: ${isLocal ? 'LOCAL' : 'REMOTE (Production)'}`, isLocal ? 'yellow' : 'red');

    if (isRemote) {
        log('', 'reset');
        log('⚠️  WARNING: Running against PRODUCTION database!', 'red');
        log('    Press Ctrl+C to cancel, or wait 5 seconds to continue...', 'red');

        await new Promise(resolve => setTimeout(resolve, 5000));
        log('', 'reset');
    }

    try {
        // Step 1: Get all items
        const items = getAllItems(isLocal);
        log(`Found ${items.length} active items`, 'bright');

        // Step 2: Process each item
        logSection('Processing Transactions');

        let totalUpdated = 0;
        let totalSkipped = 0;

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const progress = `[${i + 1}/${items.length}]`;
            log(`${progress} Processing: ${item.code} - ${item.name}`, 'bright');

            const result = processItem(item, isLocal);
            totalUpdated += result.updated;
            totalSkipped += result.skipped;
        }

        // Summary
        logSection('Summary');
        log(`Items processed:    ${items.length}`, 'green');
        log(`Transactions updated: ${totalUpdated}`, 'green');
        log(`Transactions skipped: ${totalSkipped}`, 'yellow');

        log('', 'reset');
        log('✅ Backfill completed successfully!', 'green');

    } catch (error) {
        log('', 'reset');
        log(`❌ Error: ${error.message}`, 'red');
        console.error(error);
        process.exit(1);
    }
}

// Run
main();

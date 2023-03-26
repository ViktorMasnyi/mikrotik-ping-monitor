// Accessing console module
const { Table } = require('console-table-printer');
const pingTable = new Table();

module.exports = formatData = (pingData = [], isDebugMode) => {
    isDebugMode || console.clear();
    pingTable.table.rows = [];

    for (const { No, ip, interfaceId, sent, success, failed, status, consecutiveFailuresCount, overallStats, isPermanentError } of pingData) {
        const tableRow =    {
            '#': No,
            ip,
            'int.': interfaceId,
            // 'вих. IP': srcAddress,
            'sent': sent,
            'received': success,
            'error': failed,
            'status': status,
            'error count': consecutiveFailuresCount,
            'stats': overallStats
        };

        const rowOptions = {};

        if (consecutiveFailuresCount >= 3 || status === 'error' || isPermanentError) {
            rowOptions.color = 'red';
        }
        pingTable.addRow(tableRow, rowOptions);
    }

    pingTable.printTable()
    const date = new Date()
    console.log(date.toLocaleString());
}


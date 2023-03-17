const { NodeSSH } = require('node-ssh');
const drawTable = require('./view/consoleTable');
const player = require('play-sound')(opts = {});

process.env.NODE_ENV
    ? require('dotenv').config({path: `.env.${process.env.NODE_ENV}`})
    : require('dotenv').config()

const enableSounds = process.env.ENABLE_SOUNDS === "true";
const alarmAfterFailuresCount = Number.parseInt(process.env.ALARM_AFTER_FAILURES);
const silentAfterFailuresCount = Number.parseInt(process.env.SILENT_AFTER_FAILURES);
const isDebugMode = process.env.DEBUG_MODE === "true";


const ssh = new NodeSSH();

const hosts = require('./config/hostsList.json');

const pingData = Array.from(hosts, (host, i) => ({
    No: i + 1,
    ip: host.ip,
    interfaceId: host.interface,
    srcAddress: host['src-address'],
    sent: 0,
    success: 0,
    failed: 0,
    status: 'n/a',
    consecutiveFailuresCount: 0,
    overallStats: ''
}));

function triggerAlarm(sessionStats) {
    return enableSounds && sessionStats.consecutiveFailuresCount >= alarmAfterFailuresCount && sessionStats.consecutiveFailuresCount < silentAfterFailuresCount;
}

function getError(responseStr) {
    if (responseStr.includes('timeout')) {
        return [true, 'timeout', false];
    }
    if (responseStr.includes('host unreachable')) {
        return [true, 'host unreachable'];
    }
    if (responseStr.includes('invalid')) {
        return [true, 'invalid IP', true];
    }
    if (responseStr.includes('bad interface')) {
        return [true, 'bad interface', true]
    }
    if (responseStr.includes('input does not match any value of interface')) {
        return [true, 'invalid interface.', true]
    }
    isDebugMode && console.warn(`found unsupported message: ${responseStr}`);

    return [false, '', false];
}

ssh
    .connect({
        host: process.env.SSH_host,
        username: process.env.SSH_user,
        port: 22,
        password: process.env.SSH_passphrase,
        passphrase: process.env.SSH_passphrase
    })
    .then(() => {
        console.log(`Connected to ${process.env.SSH_host}`);
        for (let [i, host] of hosts.entries()) {
            const { ip } = host;
            ssh.exec(`ping ${ip} ${host.interface ? 'interface=' + host.interface : ''} ${host.interval ? 'interval=' + host.interval : ''} ${host['src-address'] ? 'src-address=' + host['src-address'] : ''}`, [], {
                // cwd: '/bin',
                onStdout(chunk) {
                    const responseStr = chunk.toString('utf8');
                    const [isError, errorMessage, isPermanentError] = getError(responseStr);
                    const isSessionStats = responseStr.includes('packet-loss');
                    const sessionStats = pingData[i];

                    isDebugMode && console.log(`#${i} pinging ${ip}`, chunk.toString('utf8'));

                    sessionStats.sent = ++sessionStats.sent;
                    if (isError) {
                        sessionStats.failed = ++sessionStats.failed;
                        sessionStats.status = errorMessage;
                        sessionStats.isPermanentError = isPermanentError;
                        sessionStats.consecutiveFailuresCount = ++sessionStats.consecutiveFailuresCount;
                        if (triggerAlarm(sessionStats)) {
                            player.play('./notifier/alarm.mp3', function(err){
                                if (err) console.error(`failed to play sound: ${err.message} \n${err.stack}`)
                            });
                        }
                    } else if (isSessionStats) {
                        sessionStats.overallStats = responseStr?.trim()?.split('\r')?.[0];

                        isDebugMode && console.log('====statsData', sessionStats.overallStats);
                    } else {
                        sessionStats.success = ++sessionStats.success;
                        sessionStats.status = 'ok';
                        sessionStats.consecutiveFailuresCount = 0;
                    }

                    drawTable(pingData, isDebugMode);

                },
                onStderr(chunk) {
                    console.error(`error on ${ip}`, chunk.toString('utf8'))
                },
            })
        }
    })
    .catch(e => console.error(`Error: failed to connect to ${process.env.SSH_host}`, e.message))

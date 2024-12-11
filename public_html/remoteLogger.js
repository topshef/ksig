(function() {
    var originalLog = console.log
    var originalError = console.error
    var webhookUrl = '/clientLogWebhook.php'

    function sendLogToWebhook(level, message) {
        var xhr = new XMLHttpRequest()
        xhr.open('POST', webhookUrl, true)
        xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8')
        xhr.send(JSON.stringify({ level: level, message: message }))
    }

    console.log = function() {
        // var message = Array.from(arguments).join(' ')
        
        var message = Array.from(arguments).map(arg => {
            // If the argument is an object, convert it to a JSON string
            if (typeof arg === 'object') {
                try {
                    return JSON.stringify(arg)
                } catch (e) {
                    return '[Unserializable Object Ref YH86643]'
                }
            }
            return arg
        }).join(' ')
        
        var callerInfo = getCallerInfo()

        originalLog.apply(console, arguments)
        // sendLogToWebhook('log', message)
        sendLogToWebhook(`log line ${callerInfo.lineNumber} of ${callerInfo.filename}`, message)
    }

    console.error = function() {
        var message = Array.from(arguments).join(' ')
        originalError.apply(console, arguments)
        sendLogToWebhook('error', message)
    }

    window.onerror = function(message, source, lineno, colno, error) {
        var errorMessage = message + ' at ' + source + ':' + lineno + ':' + colno
        sendLogToWebhook('error', errorMessage)
        // Return true to prevent the firing of the default event handler
        return true
    }
})()


console.log("remote logging enabled ref WU76334")

throw new Error("This is a test error QH66353")


function getCallerInfo() {
    try {
        throw new Error()
    } catch (e) {
        // Extract the relevant stack frame for where console.log or console.error was called
        var stack = e.stack.split('\n')
        // Look at the third entry, which should correspond to the original caller
        var callerInfo = stack[3] || stack[2] // different browsers may have different formats
        var match = callerInfo.match(/(https?:\/\/.*):(\d+):(\d+)/)
        if (match) {
            return {
                filename: match[1],
                lineNumber: match[2]
            }
        } else {
            return { filename: 'unknown', lineNumber: 'unknown' }
        }
    }
}

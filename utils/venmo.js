//Generate random string function
export function randomString(length, chars) {
    var result = '';
    for (var i = length; i > 0; --i) result += chars[Math.round(Math.random() * (chars.length - 1))];
    return result;
}

// Return today's date formatted as (m)m/(d)d/yyyy
export function getTodayDateString() {
    let date = new Date();
    return (date.getMonth() + 1) + "/" + date.getDate() + "/" + date.getFullYear();
}


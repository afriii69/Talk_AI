// =================== GENERATE COLOR ====================== //
const c = {
    rst: '\x1b[0m',
    b: '\x1b[34m', g: '\x1b[32m', r: '\x1b[31m', y: '\x1b[33m',
    c: '\x1b[36m', m: '\x1b[35m', bold: '\x1b[1m',
};

module.exports = {
    g: (msg) => console.log(`${c.g}${msg}${c.rst}`),
    r: (msg) => console.log(`${c.r}${msg}${c.rst}`),
    y: (msg) => console.log(`${c.y}${msg}${c.rst}`),
    b: (msg) => console.log(`${c.b}${msg}${c.rst}`),
    c: (msg) => console.log(`${c.c}${msg}${c.rst}`),
    m: (msg) => console.log(`${c.m}${msg}${c.rst}`),

    log: (color, msg) => console.log(`${c[color]}${msg}${c.rst}`),
};

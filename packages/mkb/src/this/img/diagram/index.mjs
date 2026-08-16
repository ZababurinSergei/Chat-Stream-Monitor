const parser = new DOMParser()

export const sections = {
    0: `<svg width="309" height="356" viewBox="0 0 309 356" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M0.132812 176.754C63.9577 67.1176 181.366 -0.273485 308.284 0.00083429L307.279 355.244L0.132812 176.754Z" fill="#E6E6E6"/>
</svg>`,
    1:`<svg width="309" height="356" viewBox="0 0 309 356" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M1.19321 0C128.111 0.274319 245.246 68.3054 308.43 178.399L0.278809 355.243L1.19321 0Z" fill="#F2F2F2"/>
</svg>
`,
    2:`<svg width="382" height="382" viewBox="0 0 382 382" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M330.598 0.408203C398.302 118.364 397.91 263.457 329.717 381.02L0.508057 189.783L330.598 0.408203Z" fill="url(#paint0_linear_977_3700)"/>
<defs>
<linearGradient id="paint0_linear_977_3700" x1="65.6687" y1="191.185" x2="305.383" y2="319.509" gradientUnits="userSpaceOnUse">
<stop stop-color="#1A7177"/>
<stop offset="1" stop-color="#00A0A8"/>
</linearGradient>
</defs>
</svg>
`,
    3: `<svg width="309" height="356" viewBox="0 0 309 356" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M308.424 178.643C244.6 288.37 127.191 355.67 0.364258 355.395L1.3701 0.152344L308.424 178.643Z" fill="#F2F2F2"/>
</svg>
`,
    4: `<svg width="309" height="356" viewBox="0 0 309 356" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M307.364 355.395C180.446 355.121 63.3118 287.09 0.126953 176.997L308.37 0.152344L307.364 355.395Z" fill="#E6E6E6"/>
</svg>
`,
    5: `<svg width="356" height="356" viewBox="0 0 356 356" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M47.1271 355.997C-16.0577 245.995 -15.6919 110.482 48.1329 0.753906L355.279 179.153L47.1271 355.997Z" fill="#F2F2F2"/>
</svg>
`
}

export const diagram = {
    get: (type='sections', value = 0) => {
        return  parser.parseFromString(sections[value], 'text/html').body.childNodes[0]
    }
}
export default {
    description: 'svg files',
    type: {
        get: ['sections']
    }
}
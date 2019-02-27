export default {
    input: './dist/index.js',
    output: {
        file: './dist/bundles/ng2-signalr.umd.js',
        format: 'umd',
        name: 'ng.ng2-signalr',
    },
    // External libraries.
    external: [
        '@angular/core',
        '@angular/common',
        '@angular/router',
        'rxjs/Observable',
        'rxjs/Observer'
    ],
    globals: {
        '@angular/core': 'ng.core',
        '@angular/common': 'ng.common',
        '@angular/router': 'ng.router',
        'rxjs/Observable': 'Rx',
        'rxjs/Observer': 'Rx'
    },
    onwarn: () => { return }
}

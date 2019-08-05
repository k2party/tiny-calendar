const mix = require('laravel-mix');

mix.setResourceRoot('');

mix.js('src/js/tiny-calendar.js', 'dist');
mix.sass('src/sass/tiny-calendar.scss', 'dist');

mix.copyDirectory('dist', 'demo/resources');
/*****************************************************************************************
 * Установленные пакеты и плагины:
 * 
 * cross-env    - позволяет кросплатформенно получать переменные окружения
 * html-webpack-plugin  - плагин для работы с html и pug
 * clean-webpack-plugin - очищает директорию с результатом сборки
 * ----- Pug -----
 * pug  - препроцессор pug
 * pug-loader   - загрузчик pug для webpack
 * примечание: при подключении внешних ресурсов с помощью атрибута src необходимо адрес ресурса оборачивать в require()
 * например, <img src=require("./img/image.jpg")>
 * ----- SCSS -----
 * sass-loader — загружает SCSS и компилирует его в CSS
 * sass — dart-sass, ядро sass, замена node-sass
 * postcss-loader — обработка CSS с помощью PostCSS
 * postcss-preset-env — полезные настройки PostCSS 
 * (
 *    установлено postcss-preset-env@6.7.0, для более поздних версий не работает преобразование 
 *    color:lch(53 105 40); в color: rgb(250, 0, 4);
 * )
 * resolve-url-loader — разрешение адресов в css функционалах url()
 * css-loader — загрузка стилей
 * style-loader — применение стилей к элементам DOM (для development версии)
 * mini-css-extract-plugin — применение стилей к элементам DOM с минификацией размера (для production версии)
 * ----- Babel -----
 * babel-loader — транспиляция файлов с помощью Babel и вебпака
 * @babel/core — транспиляция ES2015+ в обратно совместимый JavaScript
 * @babel/preset-env — полезные стандартные настройки Babel
 * @babel/plugin-proposal-class-properties — пример кастомной конфигурации Babel (установка свойств экземпляров в теле класса, а не в его конструкторе)
 * ----- dev server -----
 * webpack-dev-server — инструмент, позволяющий не перезапускать вебпак после каждого изменения.
 * 
 *****************************************************************************************/

const path = require('path');
const PATHS = {
    source: path.join(__dirname, 'src'),
    build: path.join(__dirname, 'dist')
}
const webpack = require('webpack');

// управляет сборкой html файлов
const HtmlWebpackPlugin = require('html-webpack-plugin');
// очищает директорию с результатами сборки
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
// размещает css в файл
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

let isDev = process.env.NODE_ENV == 'development';
// let isBuild = process.env.NODE_ENV == 'production';
let isWatch = process.env.NODE_ENV == 'watch';
isDev = isWatch ? true: isDev;

module.exports = {
    // точка входа
    entry: PATHS.source,
    // параметры для выходных файлов
    output: { 
        filename: 'app/[name]-bandle.js',
        path: PATHS.build,
    },

    // включить source-map для devtools
    devtool: isDev ? 'source-map': false,
    // Режим: "development" | "production" | "none"
    mode: isDev ? 'development': 'production', 
    // сервер для организации livereload
    devServer: {
        hot: true, // разрешает горячую замену модулей
        open: isWatch, // запускает devserver 
        port: 4200,
        static: {
            //отслеживает изменения в директории src
            directory: PATHS.source,
        },
    },
    // модули, загрузчики
    module:{
        rules: [ // правила для загрузчиокв (loaders)
            {// Pug loader
                test: /\.pug$/,
                loader: 'pug-loader',
                options: {
                    pretty: true,
                    exports: false,
                }
            },
            {// SASS loader
                test: /\.scss$/,
                use: [
                    { // применение стилей к DOM ()
                        loader: MiniCssExtractPlugin.loader,
                        options:{
                            publicPath: '../',
                            // hmr: true,  // Hot Module Replacement - разрешает горячую замену (для watch), нужна в режиме разработки
                        },
                    }, 
                    { // загрузчик css
                        loader: 'css-loader',
                        options: {
                            sourceMap: true,
                            importLoaders: 2,
                            // 0 => no loaders (default);
                            // 1 => postcss-loader;
                            // 2 => postcss-loader, sass-loader
                            modules: false,
                        }
                    },
                    { // пост обработка css (расстановка префиксов)
                        loader: 'postcss-loader',
                        options: {
                            sourceMap: true,
                            postcssOptions:{
                                plugins:[
                                    // postcss-preset-env возвращает набор плагинов для обработки css
                                    require('postcss-preset-env')({
                                        browsers: 'last 2 versions',
                                        autoprefixer: { grid: true },
                                      }),
                                ],
                            },
                        },
                    },
                    {
                        loader: 'resolve-url-loader',
                        options: {
                            sourceMap: true,
                            removeCR: true, // for windows os
                        }
                    }, 
                    { // загрузчик SASS (преобразует в css)
                        loader: 'sass-loader',
                        options: {
                            sourceMap: true,
                        },
                    }
                ]
            },
            { // загрузчик js, полифил bubel
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env'],
                        plugins: ['@babel/plugin-proposal-class-properties'],
                    },
                },

            },
            { // загрузчик картинок встроен в webpack
                test: /\.(png|jpe?g|gif|svg|webp|ico)$/,
                // В продакшен режиме изображения размером до 8кб будут инлайнится в код
                // В режиме разработки все изображения будут помещаться в dist/img
                type: isDev ? 'asset/resource': 'asset',
                generator: {
                    filename: 'img/[name]-[hash].[ext]',
                },
            },
            { // загрузка шрифтов
                test:/\.(woff2?|eot|ttf|otf)$/,
                type: 'asset/resource',
                generator: {
                    filename: 'fonts/[name].[ext]',
                }
            }
        ],
    },
    // плагины
    plugins:[ 
        
        new CleanWebpackPlugin({
            // имитация удаления 
            dry: isWatch,
        }),
        // сборка index.html
        new HtmlWebpackPlugin({
            filename: 'index.html',
            // chunks: ['index'],
            // inject: true,
            template: PATHS.source + '/pages/index/index.pug'
        }),
        // сборка page-1.html
        new HtmlWebpackPlugin({
            filename: 'page-1.html',
            // chunks: ['page-1'],
            // inject: true,
            template: PATHS.source + '/pages/page-1/page-1.pug'
        }),
        
        new MiniCssExtractPlugin({
            filename: './css/[name]-[hash].css',
            chunkFilename: './css/[id].css'
        }),
    ],

    optimization:{ // оптимизация

    }
}
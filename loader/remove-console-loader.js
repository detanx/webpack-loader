// remove-console-loader.js 注意修改相应的配置
module.exports = function(source) {
    console.log('sourse',typeof source)
    source = source.replace(/console\.log\(.*?\);?/i, '');
    source = source.replace(/(var)/i, 'let');
    source = source.replace(/={2}?[^=]/, '===')
    this.callback(null, source)
    return source;
};

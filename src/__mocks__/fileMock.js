// Mock para assets estáticos (MP3, imagens, etc.) no Jest
// Metro Bundler resolve require('./file.mp3') para um número (asset ID),
// aqui simulamos com uma string identificável para testes.
module.exports = 'test-file-stub';

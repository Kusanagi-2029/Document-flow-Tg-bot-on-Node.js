const sequelize = require('../db'); // импорт объекта Sequelize
const { DataTypes } = require('sequelize'); // необходим для указания типов атрибутов.

const DocThemesModel = sequelize.define('doc_themes', {
    themeName: { type: DataTypes.STRING(1024), unique: true, comment: 'Тема. Наименование тематики' },
    description: { type: DataTypes.STRING(2048), comment: 'Текстовое описание, руководство, комментарий'},
    documentation: { type: DataTypes.STRING(1024), comment: 'Документация (ссылка на документацию)' },
    image: { type: DataTypes.STRING(1024), comment: 'Скриншот или картинка (ссылка)' },
    ethalonFile: { type: DataTypes.STRING(1024) , comment: 'Эталонный файл, шаблон или пример (ссылка)' }
})

module.exports = DocThemesModel;
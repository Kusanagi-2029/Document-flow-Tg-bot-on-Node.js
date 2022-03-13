const sequelize = require('../db'); // импорт объекта Sequelize
const { DataTypes } = require('sequelize'); // необходим для указания типов атрибутов.

const UsersModel = sequelize.define('users', {
    chatId: { type: DataTypes.STRING, unique: false, comment: 'Идентификатор пользователя в чате относительно инфраструктуры Telegram' },
    userName: { type: DataTypes.STRING, unique: false, comment: 'Имя пользователя в Telegram, используемое при обращении и поиске' },
    fullName: { type: DataTypes.STRING, unique: false, comment: 'Имя пользователя в Telegram, отображаемое в контактах' },
    commandLog: { type: DataTypes.STRING(5120), unique: false, comment: 'Введённые пользователем команды для отслеживание активности' }
})

module.exports = UsersModel;
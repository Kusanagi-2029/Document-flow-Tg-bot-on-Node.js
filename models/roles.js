const sequelize = require('../db'); // импорт объекта Sequelize
const { DataTypes } = require('sequelize'); // необходим для указания типов атрибутов.

const RolesModel = sequelize.define('roles', {
    roleName: { type: DataTypes.STRING(512), comment: 'Название роли' },
    roleDescription: { type: DataTypes.STRING(5120), comment: 'Описание роли' },
    rolePassword: { type: DataTypes.STRING(512), comment: 'Пароль для получения роли' },
    chatId: { type: DataTypes.STRING, unique: false, comment: 'Идентификатор пользователя в чате относительно инфраструктуры Telegram' },
    userName: { type: DataTypes.STRING, unique: false, comment: 'Имя пользователя в инфраструктуре Telegram, который стал администратором чата в Tg' },
    fullName: { type: DataTypes.STRING, unique: false, comment: 'Имя пользователя в Telegram (отображаемое в контактах), который стал администратором чата в Tg' },
})

module.exports = RolesModel;
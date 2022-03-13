const sequelize = require('../db'); // импорт объекта Sequelize
const { DataTypes } = require('sequelize'); // необходим для указания типов атрибутов.

const ProposalModel = sequelize.define('proposal_themes', {
    proposedTheme: { type: DataTypes.STRING(5120), comment: 'Тема на предложение' },
    chatId: { type: DataTypes.STRING, unique: false, comment: 'Идентификатор предложившего тему пользователя в чате относительно инфраструктуры Telegram' },
    userName: { type: DataTypes.STRING, unique: false, comment: 'Имя пользователя в инфраструктуре Telegram, предложившего тему' },
    fullName: { type: DataTypes.STRING, unique: false, comment: 'Имя пользователя в Telegram (отображаемое в контактах), предложившего тему' },
})

module.exports = ProposalModel;
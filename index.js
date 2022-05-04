const TelegramApi = require('node-telegram-bot-api'); // Импорт в проект nodemon для автоматической перезагрузки сервера.
const { messageTypes } = require('node-telegram-bot-api/src/telegram'); // Импорт в проект файла для работы с разными типами сообщений: текстом, аудио, документами и т.п.
const sequelize = require('./db'); // импорт объекта Sequelize
const { QueryTypes } = require('@sequelize/core');
const { Op } = require('@sequelize/core');
/* 
const path = require('path');
const basename = path.basename(__filename);
var request = require('request');
var http = require("http");
var fs = require('fs');
 */
const UsersModel = require('./models/users'); // импорт модели пользователей
const ProposalModel = require('./models/proposal'); // импорт модели с таблицей для предложений
const DocThemesModel = require('./models/doc_themes'); // импорт модели тем документации
const RolesModel = require('./models/roles'); // импорт модели с ролями

const token = 'Your bot token'; // Токен созданного бота.

/* новый TelegramBot(токен, [параметры]) - метод запроса для получения сообщений: 
- Чтобы использовать стандартный опрос, нужно установить для параметров polling:true. 
- Выдает сообщение, когда приходит сообщение. */
const bot = new TelegramApi(token, { polling: true });

// Добавление слушателя событий на обработку полученных сообщений.
// Вторым параметром данная функция принимает callback.
bot.on('message', async msg => {
  console.log(msg);
  const text = msg.text;
  const commandLog = text;
  const chatId = msg.chat.id;
  const userName = `${msg.from.username}`;
  const fullName = `${msg.from.first_name} ${msg.from.last_name}`;

  // Создание команд при обращении к приложению. Представляет из себя функцию, принимающую массив объектов, которые содержат поля команды и её описания.
  const COMMANDS = [
    {
      command: 'help',
      description: 'Помощь по командам',
    },
    {
      command: 'info',
      description: 'Просмотр тем',
    }
  ]

  // Установка для бота на использование данных команд
  bot.setMyCommands(COMMANDS);
  // Написание логики для каждой команды. Ключевое слово await необходимо для организации асинхронности функций.
  try {

    await sequelize.authenticate(); // открытие и одновременная проверка на успешность соединения к БД.
    await sequelize.sync(); // данная функция нужна для синхронизации моделей, указанных в коде, с таблицами в БД.

    // Добавление обработки сообщения запроса на вывод всех доступных команд
    let helpText = `*Дока* к Вашим услугам (･ิᴗ･ิ๑)\n \n*Доступные команды:*\n`;
    helpText += COMMANDS.map(
      (command) => `*\n/${command.command}* — ${command.description}`
    ).join(`\n`);

    if (text === '/start' || text === 'Старт' || text === 'старт' || text === 'привет' || text === 'Дока' || text === 'дока') {
      try {
        await UsersModel.create({ chatId, userName, fullName, commandLog }); // При первом подключении к приложению информация о пользователе сразу сохранится в базу данных.
        const lastUser = await UsersModel.findOne({
          where: { commandLog: '/start' },
          order: [['createdAt', 'DESC']]
        });
        const chatIdStart = lastUser.chatId;
        return bot.sendMessage(chatIdStart, `Добро пожаловать, *${lastUser.fullName}* \n ${helpText}`, { parse_mode: "Markdown" });
      }
      catch (e) {
        return bot.sendMessage(chatId, 'У Вас проблемы с интернет-соединением либо связь с Базой данных установить не удалось.');
      }
    }

    if (text === '/help' || text === 'команды') {
      try {
        await UsersModel.create({ chatId, userName, fullName, commandLog }); // Каждое действие пользователя логируется в базу данных.
        await bot.sendMessage(chatId, `*${fullName},*`, { parse_mode: "Markdown" });
        return bot.sendMessage(chatId, `${helpText}\n \n*/admin* - Узнать кто администратор\n \nДля добавления темы используйте ключевую фразу *Тема:*`, {
          parse_mode: "Markdown", // нужно указать для включения поддержки синтаксиса .md - для редактирования текста.
        });
      }
      catch (e) {
        return bot.sendMessage(chatId, 'У Вас проблемы с интернет-соединением либо связь с Базой данных установить не удалось.');
      }
    }

    if (text === '/info' || text === 'Информация о темах') {
      try {
        await UsersModel.create({ chatId, userName, fullName, commandLog }); // Каждое действие пользователя логируется в базу данных.
        bot.sendMessage(chatId, `\n*/topicsList* — Темы на просмотр из подсистемы "N"\n    */topicsLast_25* — Последние 25 тем из подсистемы "N".\n \nЧтобы получить подробности о теме, введите её номер (id)\n \n*/proposedThemeLast* — Последняя предложенная тема.\n    */proposedThemesLast_10* — Последние 10 предложенных тем.\n`, { parse_mode: "Markdown" });
      }
      catch (e) {
        return bot.sendMessage(chatId, 'У Вас проблемы с интернет-соединением либо связь с Базой данных установить не удалось.');
      }
    }

    if (text === '/proposedThemeLast' || text === 'Последняя предложенная тема') {
      try {
        await UsersModel.create({ chatId, userName, fullName, commandLog }); // Каждое действие пользователя логируется в базу данных.
        bot.sendMessage(chatId, `*Последняя предложенная тема:*`, { parse_mode: "Markdown" });
        const proposedThemes = await ProposalModel.findAll({
          limit: 1, // Если значение установленного лимита будет больше кол-ва записей, то просто выведутся все имеющиеся записи. (Т.е. это эквивалентно выведению всех записей)
          order: [
            ['id', 'DESC'], // последние записи
          ],
          attributes: ['id', 'proposedTheme', 'fullName', 'userName', 'createdAt']
        });
        const str = JSON.stringify(proposedThemes, null, 2); // Значение из БД, преобразованное в строку, необработанное. (с Табулятивным отступом, кратным значению-параметру в конце)
        const strModificationIteration1 = str.replace(/[{,"\[\]}]/gi, ''); // Первая итерация изменения строкового значения полученных данных.
        const strModificationIteration2 = strModificationIteration1.replace(new RegExp("id", "g"), 'Id темы');
        const strModificationIteration3 = strModificationIteration2.replace(new RegExp("proposedTheme", "g"), 'Название');
        const strModificationIteration4 = strModificationIteration3.replace(new RegExp("fullName", "g"), 'Добавлено пользователем');
        const strModificationIteration5 = strModificationIteration4.replace(new RegExp("userName: ", "g"), 'Контакт которого: @');
        const strModificationIteration6 = strModificationIteration5.replace(new RegExp("createdAt", "g"), 'Дата добавления');
        bot.sendMessage(chatId, strModificationIteration6);
      }
      catch (e) {
        return bot.sendMessage(chatId, 'У Вас проблемы с интернет-соединением либо связь с Базой данных установить не удалось.');
      }
    }

    // Вывод 10 последних предложенных тем
    if (text === '/proposedThemesLast_10' || text === '10 последних предложенных тем') {
      try {
        await UsersModel.create({ chatId, userName, fullName, commandLog }); // Каждое действие пользователя логируется в базу данных.
        bot.sendMessage(chatId, `*10 последних предложенных тем:*`, { parse_mode: "Markdown" });
        const proposedThemes = await ProposalModel.findAll({
          limit: 10, // Если значение установленного лимита будет больше кол-ва записей, то просто выведутся все имеющиеся записи. (Т.е. это эквивалентно выведению всех записей)
          order: [
            ['id', 'DESC'], // последние записи
          ],
          attributes: ['id', 'proposedTheme', 'fullName', 'userName', 'createdAt']
        });
        const str = JSON.stringify(proposedThemes, null, 2); // Значение из БД, преобразованное в строку, необработанное. (с Табулятивным отступом, кратным значению-параметру в конце)
        const strModificationIteration1 = str.replace(/[{,"\[\]}]/gi, ''); // Первая итерация изменения строкового значения полученных данных.
        const strModificationIteration2 = strModificationIteration1.replace(new RegExp("id", "g"), 'Id темы');
        const strModificationIteration3 = strModificationIteration2.replace(new RegExp("proposedTheme", "g"), 'Название');
        const strModificationIteration4 = strModificationIteration3.replace(new RegExp("fullName", "g"), 'Добавлено пользователем');
        const strModificationIteration5 = strModificationIteration4.replace(new RegExp("userName: ", "g"), 'Контакт которого: @');
        const strModificationIteration6 = strModificationIteration5.replace(new RegExp("createdAt", "g"), 'Дата добавления');
        bot.sendMessage(chatId, strModificationIteration6);
      }
      catch (e) {
        return bot.sendMessage(chatId, 'У Вас проблемы с интернет-соединением либо связь с Базой данных установить не удалось.');
      }
    }


    // Внесение предложенной темы
    if (typeof text === 'string') { // Если сообщение пользователя состоит из строки, то выполнить
      // При внесении пользователем темы:
      if (text.includes('Тема:')) { // Метод includes() проверяет, содержит ли строка заданную подстроку, и возвращает, соответственно true или false. Является регистрозависимым.
        try {
          const roleAdmin = await RolesModel.findOne({
            chatId,
            where: { roleName: 'admin' }
          });
          const chatIdAdmin = roleAdmin.chatId;

          await UsersModel.create({ chatId, userName, fullName, commandLog }); // Каждое действие пользователя логируется в базу данных.
          ProposalModel.create({ proposedTheme: `${text}`, chatId: `${chatId}`, userName: `${userName}`, fullName: `${fullName}` });
          await bot.sendMessage(chatId, `Тема отправлена на предложение.\n \nСмотреть последнюю предложенную тем: /proposedThemeLast`); // Оповещение пользователя о добавлении темы (появлении в списке предложенных)
          return bot.sendMessage(chatIdAdmin, `*Была добавлена следующая тема:*\n${text}`, { parse_mode: "Markdown" }); // Сообщение о добавлении темы сразу отправляется администратору.
        }
        catch (e) {
          return bot.sendMessage(chatId, 'У Вас проблемы с интернет-соединением либо связь с Базой данных установить не удалось.');
        }
      }
    }
    else {
      bot.sendMessage(chatId, 'В чат можно отправлять только текстовые сообщения!');
    }

    // Вывод всех тем из подсистемы
    if (text === '/topicsList' || text === 'см темы') {
      try {
        await UsersModel.create({ chatId, userName, fullName, commandLog }); // Каждое действие пользователя логируется в базу данных.
        bot.sendMessage(chatId, `*На данный момент доступны следующие темы для просмотра.\nДля просмотра содержимого по теме введите её номер*`, { parse_mode: "Markdown" });
        for (let i = 1; i <= 99999999; i++) {
          const theme = await DocThemesModel.findByPk(`${i}`);
          if (theme.themeName === null || theme.themeName === undefined) {
            bot.sendMessage(chatId, `Тема не дополнена: название отсутствует. Обратитесь к руководству проекта.`);
          }
          else if (theme.description === null || theme.description === undefined) {
            bot.sendMessage(chatId, `\` \` \`${theme.id}\`\`\` *)  ${theme.themeName}* (нет описания)`, { parse_mode: "Markdown" });
          } else {
            bot.sendMessage(chatId, `\` \` \`${theme.id}\`\`\` *)  ${theme.themeName}* — ${theme.description}`, { parse_mode: "Markdown" });
          }
        }
      }
      catch (e) {
        return bot.sendMessage(chatId, 'У Вас проблемы с интернет-соединением либо связь с Базой данных установить не удалось.');
      }
    }

    // Вывод последних 25 тем из подсистемы
    if (text === '/topicsLast_25' || text === '25 последних тем из подсистемы') {
      try {
        await UsersModel.create({ chatId, userName, fullName, commandLog }); // Каждое действие пользователя логируется в базу данных.
        bot.sendMessage(chatId, `*25 последних тем из подсистемы :*`, { parse_mode: "Markdown" });
        const systemTheme = await DocThemesModel.findAll({
          limit: 10, // Если значение установленного лимита будет больше кол-ва записей, то просто выведутся все имеющиеся записи. (Т.е. это эквивалентно выведению всех записей)
          order: [
            ['id', 'DESC'], // последние записи
          ],
          attributes: ['id', 'themeName', 'description']
        });
        const str = JSON.stringify(systemTheme, null, 2); // Значение из БД, преобразованное в строку, необработанное. (с Табулятивным отступом, кратным значению-параметру в конце)
        const strModificationIteration1 = str.replace(/[{,"\[\]}]/gi, ''); // Первая итерация изменения строкового значения полученных данных.
        const strModificationIteration2 = strModificationIteration1.replace(new RegExp("id", "g"), 'Id темы');
        const strModificationIteration3 = strModificationIteration2.replace(new RegExp("themeName", "g"), 'Название');
        const strModificationIteration4 = strModificationIteration3.replace(new RegExp("description", "g"), 'Описание');
        bot.sendMessage(chatId, strModificationIteration4);
      }
      catch (e) {
        return bot.sendMessage(chatId, 'У Вас проблемы с интернет-соединением либо связь с Базой данных установить не удалось.');
      }
    }

    // Вывод темы из подсистемы по номеру идентификатора в ней
    if (!isNaN(parseFloat(msg.text)) && isFinite(msg.text)) { // Если введённое сообщение является числом (причём конечным), то
      await UsersModel.create({ chatId, userName, fullName, commandLog }); // Каждое действие пользователя логируется в базу данных.
      // Попробовать найти в бд, в таблице doc_types запись с ключом, номер которого был введён пользователем
      try {
        const data = await DocThemesModel.findByPk(id = msg.text);
        if (data.themeName === null || data.themeName === undefined) {
          bot.sendMessage(chatId, `Тема не дополнена: название отсутствует. Обратитесь к руководству проекта.`);
        } else if (data.description === null || data.description === undefined) {
          bot.sendMessage(chatId, `${data.themeName} — У темы нет описания`);
        }
        else {
          bot.sendMessage(chatId, `\n*${data.themeName}* — ${data.description}`, { parse_mode: "Markdown" });
        }
        if (data.documentation === null || data.documentation === undefined) {
          bot.sendMessage(chatId, `\nДокументация отсутствует`);
        } else {
          bot.sendMessage(chatId, `\n*Документация:* ${data.documentation}`, { parse_mode: "Markdown" });
        }
        if (data.image === null || data.image === undefined) {
          bot.sendMessage(chatId, `\nПредставление отсутствует`);
        } else {
          bot.sendMessage(chatId, `\n*Представление:* ${data.image}`, { parse_mode: "Markdown" });
        }
        if (data.ethalonFile === null || data.ethalonFile === undefined) {
          bot.sendMessage(chatId, `\nЭталонный файл отсутствует`);
        } else {
          bot.sendMessage(chatId, `\n*Эталонный файл:* ${data.ethalonFile}`, { parse_mode: "Markdown" });
        }
      }
      catch (e) {
        return bot.sendMessage(chatId, 'Такой темы ещё нет, или она была удалена. Возможно, что соединение с БД было потеряно.');
      }
    }

    // Узнать кто администратор
    if (text === '/admin' || text === 'admin' || text === 'админ') {
      try {
        const roles = await RolesModel.findOne({
          chatId,
          where: { roleName: 'admin' }
        });
        if (chatId == roles.chatId) {
          bot.sendMessage(chatId, `${roles.fullName}, Вы - действующий администратор.\n \nКоманды администратора:\n\n/view_10_last_propose_or_view_members — Просмотр 10 последних предложивших или просмотревших из подсистемы темы пользователей. \n\n/view_20_last_logs — Вывод последних 20 записей о пользователях (их логов). \n\n/view_20_new_member — Вывод последних 20 тех, кто присоединился.`);
          bot.sendMessage(chatId, `\n/get_admin — Попытаться стать администратором. \n`);
        }
        else {
          bot.sendMessage(chatId, `Вы - не администратор. За всеми вопросами обращайтесь к текущему администратору ${roles.fullName} (@${roles.userName})`);
        }
      }
      catch (e) {
        return bot.sendMessage(chatId, 'У Вас проблемы с интернет-соединением либо связь с Базой данных установить не удалось.');
      }
    }

    // Попробовать стать администратором
    if (text === '/get_admin' || text === 'стать администратором') {
      try {
        bot.sendMessage(chatId, 'Введите пароль администратора');
        bot.on('message', async roles => {
          const theme = roles.text;
          await UsersModel.create({ chatId, userName, fullName, commandLog }); // Каждое действие пользователя логируется в базу данных.
          const userRoles = await RolesModel.findOne({
            chatId,
            where: { roleName: 'admin' }
          });

          // Если пароль совпадает с тем, что указан в БД
          if (theme === `${userRoles.rolePassword}`) {
            RolesModel.update(
              { chatId: `${chatId}`, userName: `${userName}`, fullName: `${fullName}` },
              { where: { roleName: 'admin' } },
            );
            return bot.sendMessage(chatId, `${userRoles.fullName} (@${userRoles.userName}) - больше не администратор.`);
          }
        })
      }
      catch (e) {
        return bot.sendMessage(chatId, 'У Вас проблемы с интернет-соединением либо связь с Базой данных установить не удалось.');
      }
    }

    //////////////////////////////// команды администратора ////////////////////////////////
    // Где пользователь, обращающийся к приложению, имеет роль "администратор"
    const roleAdmin = await RolesModel.findOne({
      chatId,
      where: { roleName: 'admin' }
    })
    // Если пользователь - администратор, то ему доступны следующие команды:
    if (chatId == roleAdmin.chatId) {

      // Просмотр 10 последних предложивших или просмотревших из подсистемы темы пользователей.
      if (text === '/view_10_last_propose_or_view_members' || text === 'Просмотр 10 последних предложивших или просмотревших') {
        try {
          // Найти последнего пользователя, ввёдшего команду, которая не равна перечисленным: '/add', '/help', '/start', '/info', '/view_20_last_logs', '/view_20_new_member', '/proposedThemeLast', '/proposedThemesLast_10', '/topicsList', '/topicsLast_25', '/admin', '/get_admin', '/view_10_last_propose_or_view_members'
          const userLogs = await UsersModel.findAndCountAll({
            commandLog,
            limit: 10,
            where: {
              [Op.not]: [
                { commandLog: ['/add', '/help', '/start', '/info', '/view_20_last_logs', '/view_20_new_member', '/proposedThemeLast', '/proposedThemesLast_10', '/topicsList', '/topicsLast_25', '/admin', '/get_admin', '/view_10_last_propose_or_view_members'] },
              ]
            }, // условие, что пользователь ввёл "/start" - присоединился
            order: [
              ['id', 'DESC'], // последние записи
            ],
            attributes: ['id', 'chatId', 'userName', 'fullName', 'commandLog', 'createdAt']
          });
          const roles = await RolesModel.findOne({ chatId });
          const adminChatId = roles.chatId;
          const str = JSON.stringify(userLogs, null, 1); // Значение из БД, преобразованное в строку, необработанное. (с Табулятивным отступом, кратным значению-параметру в конце)
          const strModificationIteration1 = str.replace(/[{,"\[\]}]/gi, ''); // Первая итерация изменения строкового значения полученных данных.
          const strModificationIteration2 = strModificationIteration1.replace('count', 'Всего предложили тем');
          const strModificationIteration3 = strModificationIteration2.replace('rows', 'Записи о пользователях');
          const strModificationIteration4 = strModificationIteration3.replace(new RegExp("id", "g"), 'ID в нашей системе');
          const strModificationIteration5 = strModificationIteration4.replace(new RegExp("chatId", "g"), 'ID в Telegram');
          const strModificationIteration6 = strModificationIteration5.replace(new RegExp("userName: ", "g"), 'Имя-контакт в Tg: @');
          const strModificationIteration7 = strModificationIteration6.replace(new RegExp("fullName", "g"), 'ФИО');
          const strModificationIteration8 = strModificationIteration7.replace(new RegExp("commandLog", "g"), 'Ввод команды');
          const strModificationIteration9 = strModificationIteration8.replace(new RegExp("createdAt", "g"), 'Дата ввода');
          bot.sendMessage(adminChatId, strModificationIteration9);
        }
        catch (e) {
          return bot.sendMessage(chatId, 'У Вас проблемы с интернет-соединением либо связь с Базой данных установить не удалось.');
        }
      }

      // Вывод последних 20 записей о пользователях (их логов)
      if (text === '/view_20_last_logs' || text === 'Вывод последних 20 записей о пользователях (их логов)') {
        try {
          const userLogs = await UsersModel.findAndCountAll({
            limit: 20,  // 20 записей
            order: [
              ['id', 'DESC'], // последние записи
            ],
            attributes: ['id', 'chatId', 'userName', 'fullName', 'commandLog', 'createdAt']
          });
          const roles = await RolesModel.findOne({ chatId });
          const adminChatId = roles.chatId;
          const str = JSON.stringify(userLogs, null, 1); // Значение из БД, преобразованное в строку, необработанное. (с Табулятивным отступом, кратным значению-параметру в конце)
          const strModificationIteration1 = str.replace(/[{,"\[\]}]/gi, ''); // Первая итерация изменения строкового значения полученных данных.
          const strModificationIteration2 = strModificationIteration1.replace('count', 'Всего записей-логов');
          const strModificationIteration3 = strModificationIteration2.replace('rows', 'Записи о пользователях');
          const strModificationIteration4 = strModificationIteration3.replace(new RegExp("id", "g"), 'ID в нашей системе');
          const strModificationIteration5 = strModificationIteration4.replace(new RegExp("chatId", "g"), 'ID в Telegram');
          const strModificationIteration6 = strModificationIteration5.replace(new RegExp("userName: ", "g"), 'Имя-контакт в Tg: @');
          const strModificationIteration7 = strModificationIteration6.replace(new RegExp("fullName", "g"), 'ФИО');
          const strModificationIteration8 = strModificationIteration7.replace(new RegExp("commandLog", "g"), 'Ввод команды');
          const strModificationIteration9 = strModificationIteration8.replace(new RegExp("createdAt", "g"), 'Дата ввода');
          bot.sendMessage(adminChatId, strModificationIteration9);
        }
        catch (e) {
          return bot.sendMessage(chatId, 'У Вас проблемы с интернет-соединением либо связь с Базой данных установить не удалось.');
        }
      }

      // Вывод последних 20 тех, кто ввёл команду /start, т.е. присоединился
      if (text === '/view_20_new_member' || text === 'Вывод последних 20 тех, кто присоединился') {
        try {
          const userLogs = await UsersModel.findAndCountAll({
            limit: 20,  // 20 записей
            where: { commandLog: '/start' }, // условие, что пользователь ввёл "/start" - присоединился
            order: [
              ['id', 'DESC'], // последние записи
            ],
            attributes: ['id', 'chatId', 'fullName', 'userName', 'createdAt'] // список атрибутов, которые будут выведены при запросе
          });
          const roles = await RolesModel.findOne({ chatId });
          const adminChatId = roles.chatId;
          const str = JSON.stringify(userLogs, null, 1); // Значение из БД, преобразованное в строку, необработанное. (с Табулятивным отступом, кратным значению-параметру в конце)
          const strModificationIteration1 = str.replace(/[{,"\[\]}]/gi, ''); // Первая итерация изменения строкового значения полученных данных.
          const strModificationIteration2 = strModificationIteration1.replace('count', 'Всего присоединившихся пользователей');
          const strModificationIteration3 = strModificationIteration2.replace('rows', 'Записи о последних 20 из них');
          const strModificationIteration4 = strModificationIteration3.replace(new RegExp("id", "g"), 'ID в нашей системе');
          const strModificationIteration5 = strModificationIteration4.replace(new RegExp("chatId", "g"), 'ID в Telegram');
          const strModificationIteration6 = strModificationIteration5.replace(new RegExp("fullName", "g"), 'ФИО');
          const strModificationIteration7 = strModificationIteration6.replace(new RegExp("userName: ", "g"), 'Имя-контакт в Tg: @');
          const strModificationIteration8 = strModificationIteration7.replace(new RegExp("createdAt", "g"), 'Дата присоединения');
          bot.sendMessage(adminChatId, strModificationIteration8);
        }
        catch (e) {
          return bot.sendMessage(chatId, 'У Вас проблемы с интернет-соединением либо связь с Базой данных установить не удалось.');
        }
      }
    }
    //////////////////////////////////////////////////////////////// ВРЕМЕННО ////////////////////////////////////////////////////////////////

    if (text === '[' || text === ']' || text === 'х' || text === 'ъ') {
      try {
        bot.sendMessage(chatId, 'Таблицы удалены',
          sequelize
            .sync() // create the database table for our model(s)
            .then(function () {
              return sequelize.drop(); // drop all tables in the db
            })
        )
      }
      catch (e) {
        return bot.sendMessage(chatId, 'У Вас проблемы с интернет-соединением либо связь с Базой данных установить не удалось.');
      }
    }

    //////////////////////////////////////////////////////////////// ВРЕМЕННО ////////////////////////////////////////////////////////////////
  } catch (e) {
    // Если введена незнакомая приложению команда (не из массива обозначенных комманд)
    // return bot.sendMessage(chatId, 'Команда некорректна, введите команду заново. ');
  }
});


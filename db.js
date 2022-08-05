// В данном файле устанавливается подключение к БД с помощью ORM Sequelize

const {Sequelize} = require('sequelize');

/* Из данного файла будет экспортирован новый объект, созданный из объекта Sequelize
В качестве параметров передаются настройки Базы Данных. 
Параметры передаются в следующем порядке:
1. Название БД
2. userName пользователя БД
3. Пароль
4. Объект опций, который содержит несколько полей:
    4.1. host (IP-адрес сервера)
    4.2. port 
    4.3. dialect (указать, с какой именно БД должна работать ORM)
*/

// This db is for deploy 
/* module.exports = new Sequelize(
    'webAppWithTelegram_db',
    'root',
    'rootpassword',
    {
        host:'ip',
        port:'port',
        dialect:'postgres'
    }
) 
*/

// This is local db ))
module.exports = new Sequelize(
    'webAppWithTelegram_db',
    'root',
    'rootpassword',
    {
        host:'ip',
        port:'port',
        dialect:'postgres'
    }
)

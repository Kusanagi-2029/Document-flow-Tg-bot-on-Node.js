# Document flow Tg-bot on Node.js - Приложение по документообороту

##### Содержание  
* [Назначение Telegram-бота](#appointment)  
* [Функционально-логические отношения процессов (IDEF0)](#functional_logical_relations_of_processes)  
* [Структура проекта](#project_structure)
* [Архитектура приложения](#architecture)
* [Список команд](#command_list)


<a name="appointment"><h2>Назначение Telegram-бота</h2></a>
Просматривать и добавлять на предложение темы документации. 
В приложении реализован функционал:
* Просмотра списка тем документации и подробных данных по номеру темы.
* Добавления темы на предложение в отдельную таблицу с текстовыми данными (текст и ссылки)
* Логирования команд пользователей - всего, что касается БД. Мусорная информация, которая не будет отправлена в БД (как загружаемый видеофайл), не заносится в логи.
* Просмотра определённой информации о системе администратором (реализована роль, которой доступны специальные команды)

![Скриншот с данными по конкретной теме](https://user-images.githubusercontent.com/71845085/183038455-6e6a67b9-f016-4247-8d3d-2bd4bf612b5c.png)
![Данные по темам](https://user-images.githubusercontent.com/71845085/183040768-d56ffa21-ac38-40b0-b98f-9fa173c683f2.png)

<a name="functional_logical_relations_of_processes"><h2>Функционально-логические отношения процессов (IDEF0)</h2></a>
В диаграммах стандарта IDEF0 отражаются исключительно функционально-логические отношения процессов, подробные детали реализации не указываются.

### Контекстная диаграмма А-0
1. Входными данными были определены: 
* заказ предприятия, 
* выделенные ресурсы, 
* информация о действующей ИС и документация по выбранным технологиям. 
2. Управляющее воздействие – требования к проекту. 
3. Механизм воздействия – разработчик ПО и средства разработки. 
4. Выходные данные – готовая ИС автоматизации процессов подготовки документации IT-проектов и руководство пользователя.
![Контекстная диаграмма А-0](https://user-images.githubusercontent.com/71845085/183040941-4fa776e7-a5c0-420c-87af-ae98a7d22cb2.jpg)
### Декомпозиция основной диаграммы А0
![Декомпозиция основной диаграммы А0](https://user-images.githubusercontent.com/71845085/183041024-2c57be0a-acda-4b4c-b3b9-d55e221772f1.png)

<a name="project_structure"><h2>Структура проекта</h2></a>
Структура проекта разрабатываемой информационной системы состоит из:
* каталога models, где находятся модели создаваемых через программный код таблиц в БД;
* файла настроек соединения с БД db.js;
* файла, являющимся точкой входа в программу – index.js;
* файлов указанных зависимостей – package-lock.json, package.json.

![Структура проекта](https://user-images.githubusercontent.com/71845085/183080530-f82a8ec0-58b7-4195-9967-67385fa7071f.png)

<a name="architecture"><h2>Архитектура приложения</h2></a>
![Архитектура приложения](https://user-images.githubusercontent.com/71845085/183041335-34d0e07a-75bb-4c71-84d8-8e514d9f623b.png)
В системе, в которую интегрируется разрабатываемое приложение, уже имеется база данных с определённой таблицей, которая заполняется вручную уполномоченным лицом или же через специальные подсистемы (в данном случае это не имеет критического значения), и из которой разрабатываемое приложение должно получать данные на чтение и выводить их своим пользователям в виде, удобным для чтения человеку, посредством Telegram-бота. 
* При этом стоит уточнить, что сами данные не хранятся в БД для обеспечения легковесности оной и скорости выполнения sql-запросов, а хранятся данные в специальном облачном хранилище, в котором их можно найти по web-ссылкам.
* Также в существующей корпоративной БД имеется таблица с прописанными ролями каждого пользователя, в которой имеется роль администратора. В данную БД разрабатываемое приложение добавляет две таблицы – для логирования базовых действий своих пользователей и для хранения предложенных ими тем технической документации.
![Таблица для логирования базовых действий пользователей](https://user-images.githubusercontent.com/71845085/183077437-044722fd-b03b-4888-9ef5-5ee67c307683.png)
![Таблица предложенных тем](https://user-images.githubusercontent.com/71845085/183077840-0282f1a2-d557-4a55-8468-d53dabaeb396.png)
* Таким образом, архитектура разрабатываемого программного продукта такова: клиентская часть основана на кроссплатформенных приложениях Telegram и взаимодействует посредством программного интерфейса приложений Telegram с серверной частью с бизнес-логикой приложения (расположенной на одном сервере); серверная часть содержит всю бизнес-логику и взаимодействует с базой данных (расположенной на другом сервере).
* Подразумевается, что база данных взаимодействует с облачным хранилищем данных (расположенном на третьем сервере) и взаимодействует с другими подсистемами предприятия по необходимости.

<a name="command_list"><h2>Список команд</h2></a>
Команды, распознаваемые приложением на основе Telegram:
| Команда                              | Описание команды   |
| ------------------------------------ |:------------------:|
| /help                                | Вывод основных команд **/help** и **/info**, команды просмотра администратора /admin и способа ввода предложенной темы|
| /info                                | Вывод команд вывода тем документации из главной таблицы тем и из таблицы предложенных тем с описанием|
| Ввод номера (id) темы                | Если тема не найдена, то будет выведено сообщение: «Такой темы ещё нет, или она была удалена». Если тема найдена, будет произведён вывод всей информации по теме, которая отображена в таблице.|
| /topicsList                          | Вывод тем на просмотр из подсистемы "N"|
| /topicsLast_25                       | Вывод последних 25 тем из подсистемы "N".|
| /proposedThemeLast                   |     Вывод последней предложенной темы.            |
| /proposedThemesLast_10               | Вывод последних 10 предложенных тем.            |
| /admin                               | Вывод информации о том, кто администратор. Если пользователь не является администратором, вывод сообщения «Вы - не администратор. За всеми вопросами обращайтесь к текущему администратору Имя_Фамилия **(@Ссылка_на_аккаунт)**».Если пользователь является администратором, оповещение его об этом и вывод команд администратора: «Имя Фамилия, Вы - действующий администратор.»|
| /view_10_last_propose_or_view_members| Просмотр 10 последних предложивших или просмотревших из подсистемы темы пользователей.            |
| /view_20_last_logs                   | Вывод последних 20 записей о пользователях (их логов).            |
| /view_20_new_member                  | Вывод последних 20 тех, кто присоединился.            |
| /get_admin                           |Попытаться стать администратором. Выводит сообщение с просьбой ввести пароль для получения данной роли. Если пароль введён неверный – команда игнорируется (далее можно, не вызывая эту команду повторно, просто ввести верный пароль). Если пароль введён верно – выводит сообщение о том, что бывший администратор более обладает данной ролью. (Происходит запись данных о новом администраторе в таблицу ролей). Проверить это можно командой **/admin**.|

Команды администратора:
| Команда       | Описание команды   |
| ------------- |:------------------:|
| /view_10_last_propose_or_view_members      | Просмотр 10 последних предложивших или просмотревших из подсистемы темы пользователей.             |
| /view_20_last_logs       | Вывод последних 20 записей о пользователях (их логов).             |
| /view_20_new_member       | Вывод последних 20 тех, кто присоединился.|

 А также вывод команды явного получения роли администратора, которое администратор может переслать другому пользователю **/get_admin** - Попытаться стать администратором. 

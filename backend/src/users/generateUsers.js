import { randomBytes } from 'node:crypto'

const FIRST_NAMES = [
  'Олександр','Дмитро','Максим','Андрій','Іван','Михайло','Сергій','Василь','Олег','Юрій',
  'Тарас','Богдан','Роман','Павло','Артем','Денис','Владислав','Микола','Євген','Ігор',
  'Олена','Марія','Анна','Ірина','Наталія','Оксана','Тетяна','Людмила','Ганна','Юлія',
  'Вікторія','Катерина','Світлана','Надія','Лариса','Валентина','Тамара','Лідія','Софія','Дарина',
]

const LAST_NAMES = [
  'Коваленко','Бондаренко','Ткаченко','Кравченко','Іваненко','Шевченко','Мельник','Поліщук',
  'Лисенко','Марченко','Клименко','Романенко','Гриценко','Павленко','Савченко','Мороз',
  'Левченко','Данченко','Олійник','Яценко','Харченко','Сидоренко','Тимченко','Петренко',
  'Власенко','Луценко','Руденко','Захарченко','Федоренко','Литвиненко',
]

const CITIES = [
  'Київ','Харків','Одеса','Дніпро','Запоріжжя','Львів','Кривий Ріг','Миколаїв',
  'Маріуполь','Луганськ','Вінниця','Херсон','Полтава','Чернігів','Черкаси','Житомир',
]

const STREETS = [
  'вул. Хрещатик','вул. Шевченка','вул. Франка','вул. Лесі Українки','вул. Грушевського',
  'вул. Незалежності','пр. Перемоги','вул. Соборна','вул. Центральна','бул. Дружби',
]

function rand(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function generatePassword() {
  return randomBytes(10).toString('base64url')
}

function transliterate(str) {
  const map = {
    'а':'a','б':'b','в':'v','г':'h','д':'d','е':'e','є':'ie','ж':'zh','з':'z',
    'и':'y','і':'i','ї':'i','й':'i','к':'k','л':'l','м':'m','н':'n','о':'o',
    'п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'kh','ц':'ts','ч':'ch',
    'ш':'sh','щ':'shch','ь':'','ю':'iu','я':'ia',
    'А':'A','Б':'B','В':'V','Г':'H','Д':'D','Е':'E','Є':'Ie','Ж':'Zh','З':'Z',
    'И':'Y','І':'I','Ї':'I','Й':'I','К':'K','Л':'L','М':'M','Н':'N','О':'O',
    'П':'P','Р':'R','С':'S','Т':'T','У':'U','Ф':'F','Х':'Kh','Ц':'Ts','Ч':'Ch',
    'Ш':'Sh','Щ':'Shch','Ь':'','Ю':'Iu','Я':'Ia',
  }
  return str.split('').map(c => map[c] ?? c).join('')
}

export function generateUser() {
  const firstName = rand(FIRST_NAMES)
  const lastName = rand(LAST_NAMES)
  const suffix = randomBytes(3).toString('hex')
  const emailFirst = transliterate(firstName).toLowerCase()
  const emailLast = transliterate(lastName).toLowerCase()
  const email = `${emailFirst}.${emailLast}.${suffix}@huligan.dev`
  const phone = `+380${randInt(50,99)}${String(randInt(1000000, 9999999))}`
  const address = `${rand(CITIES)}, ${rand(STREETS)}, ${randInt(1, 200)}`
  const password = generatePassword()

  return { firstName, lastName, email, phone, address, password }
}

export function generateUsers(count) {
  return Array.from({ length: count }, generateUser)
}

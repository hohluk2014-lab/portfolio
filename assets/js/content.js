/* ==========================================================================
   КОНТЕНТ ПОРТФОЛИО
   --------------------------------------------------------------------------
   Всё, что вы добавляете руками, живёт здесь: фотографии и фильмы.
   Тексты и контакты — в index.html.

   ФОТОГРАФИИ
     src    — путь к файлу (положите его в assets/img)
     w, h   — реальная ширина и высота в пикселях (нужны, чтобы сетка
              не «прыгала» при загрузке)
     title  — подпись
     meta   — город / место, мелким шрифтом рядом с подписью
     year   — год, выводится справа
     tags   — к каким фильтрам относится кадр (см. filters ниже)

   ВИДЕО
     poster  — картинка-обложка (assets/img). Если файла нет, карточка
               покажет первый кадр самого ролика.
     src     — локальный файл, например projects/vid/ролик.mp4
     rutube  — ссылка на ролик RUTUBE, если своего файла нет. Подойдёт
               https://rutube.ru/video/abcdef1234567890/
               или приватная: https://rutube.ru/video/abcdef.../?p=xxxx
               Если задан src, плеер откроет локальный файл.
     duration, year, title, meta
   ========================================================================== */

window.PORTFOLIO = {

  /* Фильтры над сеткой. id совпадает с tags у фотографий. */
  filters: [
    { id: 'all',        label: 'Все' },
    { id: 'wedding',    label: 'Свадьбы' },
    { id: 'portrait',   label: 'Портреты' },
    { id: 'city',       label: 'Город' },
    { id: 'travel',     label: 'Путешествия' },
    { id: 'commercial', label: 'Коммерция' }
  ],

  photos: [
    { src: 'assets/img/photo-04.jpg', w: 1200, h: 1600,
      title: 'Свадьба на закате', meta: 'Подмосковье', year: 2025,
      tags: ['wedding'], alt: 'Свадебная фотография на закате' },

    { src: 'assets/img/photo-02.jpg', w: 1600, h: 1067,
      title: 'Синий час', meta: 'Москва-Сити', year: 2025,
      tags: ['city'], alt: 'Городской пейзаж в синий час' },

    { src: 'assets/img/photo-06.jpg', w: 1200, h: 1500,
      title: 'Лес после дождя', meta: 'Карелия', year: 2024,
      tags: ['travel'], alt: 'Лес после дождя' },

    { src: 'assets/img/photo-01.jpg', w: 1200, h: 1600,
      title: 'Портрет в мягком свете', meta: 'Студия', year: 2024,
      tags: ['portrait'], alt: 'Студийный портрет в мягком свете' },

    { src: 'assets/img/photo-10.jpg', w: 1600, h: 1067,
      title: 'Первый танец', meta: 'Москва', year: 2025,
      tags: ['wedding'], alt: 'Первый танец на свадьбе' },

    { src: 'assets/img/photo-07.jpg', w: 1200, h: 1200,
      title: 'Ночной город', meta: 'Москва', year: 2025,
      tags: ['city'], alt: 'Ночная городская съёмка' },

    { src: 'assets/img/photo-11.jpg', w: 1200, h: 1500,
      title: 'Побережье', meta: 'Сочи', year: 2024,
      tags: ['travel'], alt: 'Съёмка на побережье' },

    { src: 'assets/img/photo-03.jpg', w: 1200, h: 1200,
      title: 'Чёрно-белый портрет', meta: 'Студия', year: 2023,
      tags: ['portrait'], alt: 'Чёрно-белый студийный портрет' },

    { src: 'assets/img/photo-13.jpg', w: 1200, h: 1600,
      title: 'Утро невесты', meta: 'Москва', year: 2025,
      tags: ['wedding'], alt: 'Утро невесты, сборы' },

    { src: 'assets/img/photo-09.jpg', w: 1200, h: 1600,
      title: 'Крыши', meta: 'Санкт-Петербург', year: 2024,
      tags: ['city'], alt: 'Съёмка на крыше' },

    { src: 'assets/img/photo-05.jpg', w: 1600, h: 1067,
      title: 'Дорога на юг', meta: 'Грузия', year: 2024,
      tags: ['travel'], alt: 'Путевая съёмка' },

    { src: 'assets/img/photo-12.jpg', w: 1200, h: 1200,
      title: 'Съёмка для бренда', meta: 'Москва', year: 2025,
      tags: ['commercial'], alt: 'Коммерческая съёмка для бренда' },

    { src: 'assets/img/photo-08.jpg', w: 1600, h: 1067,
      title: 'Естественный свет', meta: 'Москва', year: 2023,
      tags: ['portrait'], alt: 'Портрет при естественном свете' },

    { src: 'assets/img/photo-14.jpg', w: 1600, h: 1067,
      title: 'Репортаж с площадки', meta: 'Москва', year: 2024,
      tags: ['commercial'], alt: 'Репортажная съёмка на площадке' }
  ],

  films: [
    {
      poster: 'assets/img/video-01.jpg',
      src: 'projects/vid/Фестиваль в центре 2026.mp4',
      title: 'Фестиваль в центре 2026',
      meta: 'Репортаж',
      duration: '4:12',
      year: 2026
    },
    {
      poster: 'assets/img/video-02.jpg',
      src: 'projects/vid/Интеграция 2026.mp4',
      title: 'Интеграция 2026',
      meta: 'Репортаж',
      duration: '2:56',
      year: 2026
    },
    {
      poster: 'assets/img/video-03.jpg',
      src: 'projects/vid/В центре 2025.mp4',
      title: 'В центре 2025',
      meta: 'Репортаж',
      duration: '3:27',
      year: 2025
    },
    {
      poster: 'assets/img/video-04.jpg',
      src: 'projects/vid/Яркие Люди.mp4',
      title: 'Яркие люди',
      meta: 'Репортаж',
      duration: '1:55'
    },
    {
      poster: 'assets/img/video-01.jpg',
      src: 'projects/vid/Информпоток Длинный.mp4',
      title: 'Информпоток',
      meta: 'Репортаж',
      duration: '2:16'
    },
    {
      poster: 'assets/img/video-02.jpg',
      src: 'projects/vid/Муниципальный этап Зарница 2.0.mp4',
      title: 'Зарница 2.0',
      meta: 'Муниципальный этап',
      duration: '3:04'
    },
    {
      poster: 'assets/img/video-03.jpg',
      src: 'projects/vid/Заседание координационного совета по взаимодействию с Движением Первых при губернаторе ЛО.mp4',
      title: 'Координационный совет',
      meta: 'Движение Первых, Ленинградская область',
      duration: '3:16'
    }
  ]
};

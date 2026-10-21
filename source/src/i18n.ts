import type { Lang, LookId } from './engine/types';

/** One number in the stats strip. `count` animates; `text` is literal. */
export interface SiteStat {
  label: string;
  count?: number;
  suffix?: string;
  text?: string;
}

export interface SiteCopy {
  nav: { home: string; films: string; studio: string; craft: string; credits: string; menu: string; close: string; lang: string };
  hero: {
    eyebrow: string;
    title: string;
    sub: string;
    ctaFilms: string;
    ctaStudio: string;
    editorial: string;
    scroll: string;
  };
  stats: SiteStat[];
  films: {
    title: string;
    lede: string;
    filters: string;
    search: string;
    searchPlaceholder: string;
    all: string;
    ar: string;
    fr: string;
    en: string;
    themeFilter: string;
    allThemes: string;
    loading: string;
    emptyTitle: string;
    emptyBody: string;
    emptyNote: string;
    noResults: string;
    count: string;
    open: string;
    download: string;
    close: string;
    detail: string;
    langLabel: string;
    themeLabel: string;
    lookLabel: string;
    quoteLabel: string;
  };
  studio: {
    title: string;
    lede: string;
    tabPhoto: string;
    tabVerse: string;
    dropTitle: string;
    dropHint: string;
    dropChange: string;
    dropRemove: string;
    textLabel: string;
    textPlaceholder: string;
    attrLabel: string;
    attrPlaceholder: string;
    textLang: string;
    lookLabel: string;
    exportBtn: string;
    exporting: string;
    ready: string;
    failed: string;
    unsupported: string;
    errType: string;
    errDecode: string;
    errEmpty: string;
    spec: string;
    verseTitle: string;
    verseLede: string;
    versePlaceholder: string;
    verseCompose: string;
    verseTakes: string;
    verseSub: string;
    verseChange: string;
    versePublish: string;
    verseNote: string;
    versePreparing: string;
    verseReady: string;
    verseDownloaded: string;
    verseMic: string;
    verseListen: string;
    speakUnavailable: string;
  };
  craft: {
    title: string;
    lede: string;
    steps: { n: string; title: string; body: string }[];
    calloutTitle: string;
    calloutBody: string;
    specTitle: string;
    spec: string[];
    motionTitle: string;
    motionBody: string;
  };
  credits: {
    title: string;
    lede: string;
    note: string;
    count: string;
    empty: string;
    license: string;
    source: string;
  };
  footer: { tagline: string; note: string; backToTop: string };
}

export interface Copy {
  dir: 'rtl' | 'ltr';
  date: (d: Date) => string;
  homeQ: string;
  homeSub: string;
  mic: string;
  listening: string;
  chips: { gratitude: string; verse: string; dua: string };
  write: string;
  placeholder: string;
  send: string;
  note: string;
  today: string;
  takesTitle: string;
  takesSub: string;
  choose: string;
  publish: string;
  change: string;
  previewNote: string;
  preparing: string;
  ready: string;
  downloaded: string;
  speakUnavailable: string;
  errEncode: string;
  errUnsupported: string;
  back: string;
  switchTo: string;
  shareText: string;
  looks: Record<LookId, { n: string; d: string }>;
  /** The chrome of the public site — one block per language. */
  site: SiteCopy;
}


export const SITE_COPY: Record<Lang, SiteCopy> = {
  ar: {
    nav: { home: 'الرئيسية', films: 'الأفلام', studio: 'الاستوديو', craft: 'الصنع', credits: 'الاعتمادات', menu: 'القائمة', close: 'إغلاق', lang: 'اللغة' },
    hero: {
      eyebrow: '١٢٤ فيلمًا · ٣ لغات · ٣٥ موضوعًا',
      title: '١٢٤ قصة، ست ثوانٍ لكلٍّ منها.',
      sub: 'صورٌ فوتوغرافية حقيقية، وحركةٌ مولَّدة حقيقية، ونَصٌّ مُصفَّف بيده بالعربية والفرنسية والإنجليزية — واستوديو يحوّل صورة من صورك إلى الشيء نفسه.',
      ctaFilms: 'شاهد الأفلام',
      ctaStudio: 'اصنع واحدة',
      editorial:
        'أثَر دراسة في الاقتضاب: إطار واحد، وفكرة واحدة، وسطر ضوء. كل فيلم وُلِّد بـ Hailuo-2.3 من إطار أول، ثم مُنِّغ ورُتِّب محليًا — لا شرائح متتابعة، بل ست ثوانٍ من حركة حقيقية.',
      scroll: 'انزل',
    },
    stats: [
      { label: 'فيلم', count: 124 },
      { label: 'لغات', count: 3 },
      { label: 'موضوعًا', count: 35 },
      { label: 'الإطار', text: '1080×1920' },
      { label: 'ثانية لكل فيلم', count: 6, suffix: 'ث' },
      { label: 'الصوت', text: 'صامت' },
    ],
    films: {
      title: 'الأفلام',
      lede: 'كل مُدخل ملفٌّ حقيقي يبدأ من صورة فوتوغرافية حقيقية: 1080×1920، ست ثوانٍ، H.264، صامت. افتح أحدها لتشاهده كاملًا أو خُذ ملف الـ MP4 معك.',
      filters: 'اللغة',
      search: 'بحث',
      searchPlaceholder: 'ابحث في العناوين…',
      all: 'الكل',
      themeFilter: 'الموضوع',
      allThemes: 'كل المواضيع',
      ar: 'العربية',
      fr: 'Français',
      en: 'English',
      loading: 'جارٍ تحميل الفهرس…',
      emptyTitle: 'الفهرس ما زال في الطريق.',
      emptyBody: '١٢٤ فيلمًا تُرسم الآن. تقرأ هذه الصفحة ملف /films/films.json فور وجوده وتمتلئ وحدها — بلا إعادة تحميل.',
      emptyNote: 'تعمل محليًا؟ ضع films.json في public/films/ وستظهر الشبكة.',
      noResults: 'لا فيلم يطابق ذلك.',
      count: '{n} فيلمًا',
      open: 'افتح',
      download: 'نزّل MP4',
      close: 'إغلاق',
      detail: 'الفيلم',
      langLabel: 'اللغة',
      themeLabel: 'الموضوع',
      lookLabel: 'المظهر',
      quoteLabel: 'البيت',
    },
    studio: {
      title: 'الاستوديو',
      lede: 'أفلت صورة، اختر مظهرًا، اكتب سطرك، ثم صدّر MP4 حقيقيًا — صامت، 1080×1920، ست ثوانٍ، كله في متصفحك.',
      tabPhoto: 'صورتك',
      tabVerse: 'من المعجم',
      dropTitle: 'أفلت صورة',
      dropHint: 'JPG أو PNG أو WebP. لا تغادر جهازك.',
      dropChange: 'استبدل',
      dropRemove: 'أزل',
      textLabel: 'سطرك',
      textPlaceholder: 'اكتب الكلمات التي ستظهر في الفيلم…',
      attrLabel: 'الإسناد (اختياري)',
      attrPlaceholder: '— أو اسمٌ في الأسفل —',
      textLang: 'لغة النص',
      lookLabel: 'المظهر',
      exportBtn: 'صدّر MP4',
      exporting: 'جارٍ الرسم…',
      ready: 'حُفظ. ملف MP4 في مجلد التنزيلات.',
      failed: 'تعذّر إنشاء الفيديو في هذا المتصفح.',
      unsupported: 'هذا المتصفح لا يستطيع ترميز الفيديو — افتح أثَر في كروم أو سفاري.',
      errType: 'هذا الملف ليس صورة. استخدم JPG أو PNG أو WebP.',
      errDecode: 'تعذّرت قراءة هذه الصورة. جرّب ملفًا آخر.',
      errEmpty: 'لم يُختَر أي ملف.',
      spec: '1080 × 1920 · ٦٫٠٠ ث · ٣٠ إطارًا/ث · صامت',
      verseTitle: 'أو ابدأ من المعجم',
      verseLede: 'اكتب نية، يختار أثَر الآيةَ والمظهرَ — عشرةُ أخذات للكلمات نفسها، كلٌّ في غرفةٍ مختلفة.',
      versePlaceholder: 'اكتب ما تريد أن تشاركه…',
      verseCompose: 'اصنع',
      verseTakes: 'عشرة أساليب',
      verseSub: 'الكلمات نفسها. اختر الغرفةَ التي تشبهك.',
      verseChange: 'غيّر الآية',
      versePublish: 'انشر إلى واتساب',
      verseNote: 'تُحفظ في حالتك ٢٤ ساعة.',
      versePreparing: 'نُجهّز القصّة…',
      verseReady: 'جاهزة — اختر واتساب ثم «حالتي».',
      verseDownloaded: 'تم حفظ الفيديو.',
      verseMic: 'تحدّث الآن',
      verseListen: 'أُنصت…',
      speakUnavailable: 'الميكروفون غير متاح — اكتب بضع كلمات.',
    },
    craft: {
      title: 'كيف صُنع',
      lede: 'النسخة الصادقة، خطوةً خطوة.',
      steps: [
        {
          n: '01',
          title: 'إطار أول، ثم حركة',
          body: 'كل فيلم يبدأ من إطار أول واحد. تبدأ الـ ١٠٨ الجديدة من صورة فوتوغرافية حقيقية — مُجهَّزة برخصة ومنسوبة؛ والـ ١٦ الأولى من لوحة مولَّدة. يمرّر Hailuo-2.3 هذا الإطار إلى صورة-إلى-فيديو فيصير منها ست ثوانٍ من حركة حقيقية: ضوء يتغيّر، ضباب ينجرف، نبتة تتنفّس. ليست صورًا متتابعة.',
        },
        {
          n: '02',
          title: 'محرّك طباعة محلي',
          body: 'يُركَّب النص محليًا بمحرّك libass: تشكيل عربي صحيح، ومرور ثنائي الاتجاه، وكشف متحرك يضع الآية سطرًا سطرًا — ثم تدرّج ذهبي يُطلى على الحروف نفسها.',
        },
        {
          n: '03',
          title: 'الدرجة اللونية والسِتار',
          body: 'تُطبَّق درجة لون واحدة على المقطع كله، ثم سِتار (scrim) متدرّج يضمن أن يبقى النص مقروءًا فوق أي صورة، ثم إطار ذهبي رفيع وشريط تقدّم وشارة CTA.',
        },
        {
          n: '04',
          title: 'التصدير',
          body: 'H.264 داخل MP4، صامت تمامًا، بمعدّل إطارات ثابت — لأن واتساب يعيد الترميز على أي حال، فلا داعي لتضيع البِتات في صوت لا يُسمع.',
        },
      ],
      calloutTitle: 'التشكيل هو الفرق',
      calloutBody: '«السلام عليكم» ليست ثمانية حروف: هي كلمة واحدة ligature تتغيّر شكلها according to موضعها في السطر. التشكيل العربي لا يغيّر المظهر فحسب — بل يغيّر عدد الحروف التي عادت ستّها. أي محرّك طباعة يعامل العربية كحروف منفصلة يُنتج خطأً يمكن رؤيته بالعين المجرّدة.',
      specTitle: 'مواصفات البناء',
      spec: [
        'frame      1080 × 1920   (9:16)',
        'duration   6.00 s',
        'rate       30 fps',
        'codec      H.264 / avc1, yuv420p',
        'audio      none — silent by design',
        'container  MP4, faststart',
        'type       libass shaping + bidi',
        'grade      single LUT + scrim',
      ],
      motionTitle: 'حركة، لا صور',
      motionBody: 'كل مُدخل في هذه المجموعة ملف H.264 حقيقي مدته ست ثوانٍ. يمكن تشغيلها أو تنزيلها مباشرة من هنا.',
    },
    credits: {
      title: 'مصادر الصور',
      lede: 'ألفلام الجديدة تقوم على صور فوتوغرافية حقيقية من ويكيميديا كومنز وأوبنفيرس، والستعبان الأول تولّدت بإطارات MiniMax. أسماء المصورين والتراخيص مذكورة أدناه كما تقتضي تلك التراخيص.',
      note: 'تُستخدم الصور وفق شروط تراخيصها. تولّدت الحركة بواسطة MiniMax Hailuo-2.3 من هذه الإطارات الأولى، ورُكِّب النص محليًا.',
      count: '{n} صورة مُنَسوبة',
      empty: 'لم تُنشر قائمة المصادر بعد.',
      license: 'الرخصة',
      source: 'المصدر',
    },
    footer: {
      tagline: 'أثَر — ست ثوانٍ من الضوء.',
      note: 'بُنيت في المتصفح. لا خادم، لا حساب، لا تتبّع.',
      backToTop: 'إلى الأعلى',
    },
  },

  en: {
    nav: { home: 'Home', films: 'Films', studio: 'Studio', craft: 'Craft', credits: 'Credits', menu: 'Menu', close: 'Close', lang: 'Language' },
    hero: {
      eyebrow: '124 films · 3 languages · 35 themes',
      title: 'A hundred and twenty-four stories, six seconds each.',
      sub: 'Real photographs, real generated motion, type set by hand in Arabic, French and English — and a studio that turns a photograph of yours into the very same thing.',
      ctaFilms: 'Watch the films',
      ctaStudio: 'Make your own',
      editorial:
        'Athar is a study in restraint: one frame, one thought, one line of light. Each film was generated with Hailuo-2.3 from a single first frame, then graded and typeset locally — never a slideshow, always six seconds of motion you can publish tonight.',
      scroll: 'Scroll',
    },
    stats: [
      { label: 'films', count: 124 },
      { label: 'languages', count: 3 },
      { label: 'themes', count: 35 },
      { label: 'frame', text: '1080×1920' },
      { label: 'seconds each', count: 6, suffix: 's' },
      { label: 'audio', text: 'silent' },
    ],
    films: {
      title: 'The films',
      lede: 'Every entry is a real file that begins from a real photograph: 1080×1920, six seconds, H.264, silent. Open one to watch it full size, or take the MP4 with you.',
      filters: 'Language',
      search: 'Search',
      searchPlaceholder: 'Search titles and kickers…',
      all: 'All',
      themeFilter: 'Theme',
      allThemes: 'All themes',
      ar: 'العربية',
      fr: 'Français',
      en: 'English',
      loading: 'Loading the catalogue…',
      emptyTitle: 'The catalogue is still arriving.',
      emptyBody: '124 films are rendering now. This page reads /films/films.json the moment it exists and fills itself in — there is nothing to reload.',
      emptyNote: 'Running locally? Drop films.json into public/films/ and the gallery appears.',
      noResults: 'No film matches that.',
      count: '{n} films',
      open: 'Open',
      download: 'Download MP4',
      close: 'Close',
      detail: 'Film',
      langLabel: 'Language',
      themeLabel: 'Theme',
      lookLabel: 'Look',
      quoteLabel: 'The line',
    },
    studio: {
      title: 'The studio',
      lede: 'Drop in a photograph, choose a look, write your line, and export a real MP4 — silent, 1080×1920, six seconds, produced entirely inside your browser.',
      tabPhoto: 'Your photograph',
      tabVerse: 'From the corpus',
      dropTitle: 'Drop a photograph',
      dropHint: 'JPG, PNG or WebP. It never leaves your device.',
      dropChange: 'Replace',
      dropRemove: 'Remove',
      textLabel: 'Your line',
      textPlaceholder: 'Write the words that go on the film…',
      attrLabel: 'Attribution (optional)',
      attrPlaceholder: '— or a name at the foot —',
      textLang: 'Language of the text',
      lookLabel: 'Look',
      exportBtn: 'Export MP4',
      exporting: 'Rendering…',
      ready: 'Saved. Your MP4 is in your downloads.',
      failed: 'Could not render the video in this browser.',
      unsupported: 'This browser cannot encode video — open Athar in Chrome or Safari.',
      errType: 'That file is not an image. Use JPG, PNG or WebP.',
      errDecode: 'That image could not be read. Try another file.',
      errEmpty: 'No file was chosen.',
      spec: '1080 × 1920 · 6.00 s · 30 fps · silent',
      verseTitle: 'Or start from the corpus',
      verseLede: 'Type a wish and Athar picks the verse and the look — ten takes of the same words, each in a different room.',
      versePlaceholder: 'Type what you want to share…',
      verseCompose: 'Compose',
      verseTakes: 'Ten styles',
      verseSub: 'The same words. Choose the room that fits.',
      verseChange: 'Change the verse',
      versePublish: 'Publish to WhatsApp',
      verseNote: 'Saved to your status for 24 hours.',
      versePreparing: 'Preparing your story…',
      verseReady: 'Ready — choose WhatsApp, then Status.',
      verseDownloaded: 'Video saved.',
      verseMic: 'Speak now',
      verseListen: 'Listening…',
      speakUnavailable: 'Microphone unavailable — type a few words.',
    },
    craft: {
      title: 'How it is made',
      lede: 'The honest version, stage by stage.',
      steps: [
        {
          n: '01',
          title: 'One first frame, then motion',
          body: 'Every film starts from a single first frame. The 108 new ones begin from a real photograph — sourced, licensed and credited; the first 16 from a generated plate. Hailuo-2.3 takes that frame to video and turns it into six seconds of real movement: light shifts, mist drifts, a leaf breathes. These are not stills played in sequence.',
        },
        {
          n: '02',
          title: 'A local typography engine',
          body: 'The words are composited locally with a libass engine: correct Arabic shaping, a real bidirectional pass, and an animated reveal that wipes the verse in line by line — then a gold gradient foil over the glyphs themselves.',
        },
        {
          n: '03',
          title: 'The grade and the scrim',
          body: 'One colour grade is applied across the whole clip, then a gradient scrim so the type stays readable over any frame, then a fine gold rule, a story progress bar and a call-to-action pill.',
        },
        {
          n: '04',
          title: 'The export',
          body: 'H.264 inside an MP4, completely silent, at a fixed frame rate — WhatsApp re-encodes Status anyway, so the bits are better spent on the picture than on a track nobody hears.',
        },
      ],
      calloutTitle: 'Shaping is the whole difference',
      calloutBody:
        '“Peace be upon you” is not nine letters: it is one ligature whose shape changes with its place in the line. Arabic shaping does not merely change how the words look — it changes how many letters there are. A typesetting engine that treats Arabic as separate letters produces a visible error, and the eye finds it before the reader does.',
      specTitle: 'The build spec',
      spec: [
        'frame      1080 × 1920   (9:16)',
        'duration   6.00 s',
        'rate       30 fps',
        'codec      H.264 / avc1, yuv420p',
        'audio      none — silent by design',
        'container  MP4, faststart',
        'type       libass shaping + bidi',
        'grade      single LUT + scrim',
      ],
      motionTitle: 'Motion, not stills',
      motionBody: 'Every entry in this collection is a real six-second H.264 file. Play it here, or take the MP4 with you.',
    },
    credits: {
      title: 'Photo credits',
      lede: 'The 108 new films begin from real photographs, sourced from Wikimedia Commons and Openverse; the first 16 were generated with MiniMax. The creators and the licences are listed below, because those licences require it.',
      note: 'The pictures are used under the terms of their own licences. The motion was generated by MiniMax Hailuo-2.3 from these first frames; the type was typeset locally.',
      count: '{n} photographs credited',
      empty: 'No credit list has been published yet.',
      license: 'Licence',
      source: 'Source',
    },
    footer: {
      tagline: 'Athar — six seconds of light.',
      note: 'Built in the browser. No server, no account, no tracking.',
      backToTop: 'Back to top',
    },
  },

  fr: {
    nav: { home: 'Accueil', films: 'Films', studio: 'Studio', craft: 'Fabrication', credits: 'Crédits', menu: 'Menu', close: 'Fermer', lang: 'Langue' },
    hero: {
      eyebrow: '124 films · 3 langues · 35 thèmes',
      title: 'Cent vingt-quatre histoires, six secondes chacune.',
      sub: 'De vraies photographies, du vrai mouvement généré, des caractères composés à la main en arabe, en français et en anglais — et un studio qui transforme une de vos photos en la même chose.',
      ctaFilms: 'Voir les films',
      ctaStudio: 'Créer le vôtre',
      editorial:
        "Athar est une étude de la retenue : un plan, une pensée, une ligne de lumière. Chaque film est généré par Hailuo-2.3 à partir d'une seule première image, puis étalonné et composé localement — jamais un diaporama, toujours six secondes de mouvement.",
      scroll: 'Défiler',
    },
    stats: [
      { label: 'films', count: 124 },
      { label: 'langues', count: 3 },
      { label: 'thèmes', count: 35 },
      { label: 'format', text: '1080×1920' },
      { label: 'secondes chacun', count: 6, suffix: 's' },
      { label: 'son', text: 'muet' },
    ],
    films: {
      title: 'Les films',
      lede: 'Chaque entrée est un vrai fichier qui part d’une vraie photographie : 1080×1920, six secondes, H.264, muet. Ouvrez-en un pour le voir en grand, ou emportez le MP4.',
      filters: 'Langue',
      search: 'Recherche',
      searchPlaceholder: 'Chercher un titre…',
      all: 'Tous',
      themeFilter: 'Thème',
      allThemes: 'Tous les thèmes',
      ar: 'العربية',
      fr: 'Français',
      en: 'English',
      loading: 'Chargement du catalogue…',
      emptyTitle: 'Le catalogue est encore en route.',
      emptyBody: "124 films sont en cours de rendu. Cette page lit /films/films.json dès qu'il existe et se remplit toute seule — il n'y a rien à recharger.",
      emptyNote: 'En local ? Déposez films.json dans public/films/ et la galerie apparaît.',
      noResults: 'Aucun film ne correspond.',
      count: '{n} films',
      open: 'Ouvrir',
      download: 'Télécharger le MP4',
      close: 'Fermer',
      detail: 'Film',
      langLabel: 'Langue',
      themeLabel: 'Thème',
      lookLabel: 'Style',
      quoteLabel: 'La phrase',
    },
    studio: {
      title: "Le studio",
      lede: "Déposez une photo, choisissez un style, écrivez votre ligne, et exportez un vrai MP4 — muet, 1080×1920, six secondes, entièrement produit dans votre navigateur.",
      tabPhoto: 'Votre photo',
      tabVerse: 'Depuis le corpus',
      dropTitle: 'Déposez une photo',
      dropHint: 'JPG, PNG ou WebP. Elle ne quitte jamais votre appareil.',
      dropChange: 'Remplacer',
      dropRemove: 'Retirer',
      textLabel: 'Votre ligne',
      textPlaceholder: 'Écrivez les mots qui iront sur le film…',
      attrLabel: 'Signature (facultatif)',
      attrPlaceholder: '— ou un nom en bas —',
      textLang: 'Langue du texte',
      lookLabel: 'Style',
      exportBtn: 'Exporter le MP4',
      exporting: 'Rendu…',
      ready: 'Enregistré. Votre MP4 est dans vos téléchargements.',
      failed: "Impossible de créer la vidéo dans ce navigateur.",
      unsupported: 'Ce navigateur ne peut pas encoder de vidéo — ouvrez Athar dans Chrome ou Safari.',
      errType: "Ce fichier n'est pas une image. Utilisez JPG, PNG ou WebP.",
      errDecode: "Cette image n'a pas pu être lue. Essayez un autre fichier.",
      errEmpty: 'Aucun fichier choisi.',
      spec: '1080 × 1920 · 6,00 s · 30 i/s · muet',
      verseTitle: 'Ou partez du corpus',
      verseLede: 'Écrivez une intention : Athar choisit le verset et le style — dix prises des mêmes mots, chacune dans une pièce différente.',
      versePlaceholder: 'Écrivez ce que vous voulez partager…',
      verseCompose: 'Créer',
      verseTakes: 'Dix styles',
      verseSub: 'Les mêmes mots. Choisissez la pièce qui vous va.',
      verseChange: 'Changer le verset',
      versePublish: 'Publier sur WhatsApp',
      verseNote: 'Conservée 24 h dans votre statut.',
      versePreparing: 'Préparation de votre histoire…',
      verseReady: 'Prête — choisissez WhatsApp, puis Statut.',
      verseDownloaded: 'Vidéo enregistrée.',
      verseMic: 'Parlez maintenant',
      verseListen: 'J’écoute…',
      speakUnavailable: 'Micro indisponible — écrivez quelques mots.',
    },
    craft: {
      title: 'Comment c’est fait',
      lede: 'La version honnête, étape par étape.',
      steps: [
        {
          n: '01',
          title: 'Une première image, puis le mouvement',
          body: "Chaque film commence par une seule première image. Les 108 nouveaux partent d'une photographie réelle — sourcée, sous licence et créditée ; les 16 premiers d'une plaque générée. Hailuo-2.3 la transforme en vidéo et en fait six secondes de vrai mouvement : la lumière change, la brume dérive, une feuille respire. Ce ne sont pas des images fixes enchaînées.",
        },
        {
          n: '02',
          title: 'Un moteur de composition local',
          body: "Le texte est composé localement par un moteur libass : façage arabe correct, vraie passe bidirectionnelle, et une révélation animée qui pose le verset ligne par ligne — puis un dégradé doré appliqué sur les glyphes eux-mêmes.",
        },
        {
          n: '03',
          title: "L'étalonnage et le voile",
          body: "Un seul étalonnage est appliqué à tout le clip, puis un voile dégradé pour que le texte reste lisible sur n'importe quelle image, puis un filet doré, une barre de progression et une pastille d'appel à l'action.",
        },
        {
          n: '04',
          title: "L'export",
          body: "H.264 dans un MP4, entièrement muet, à framerate fixe — WhatsApp réencode le Statut de toute façon : autant garder les bits pour l'image plutôt que pour une piste que personne n'entend.",
        },
      ],
      calloutTitle: 'Le façage fait toute la différence',
      calloutBody:
        "« Que la paix soit sur vous » n'est pas neuf lettres : c'est une ligature dont la forme change selon sa place dans la ligne. Le façage arabe ne change pas seulement l'apparence des mots — il change le nombre de lettres. Un moteur qui traite l'arabe comme des lettres séparées produit une erreur visible, et l'œil la trouve avant le lecteur.",
      specTitle: 'La fiche de build',
      spec: [
        'frame      1080 × 1920   (9:16)',
        'duration   6.00 s',
        'rate       30 fps',
        'codec      H.264 / avc1, yuv420p',
        'audio      none — silent by design',
        'container  MP4, faststart',
        'type       libass shaping + bidi',
        'grade      single LUT + scrim',
      ],
      motionTitle: 'Du mouvement, pas des images fixes',
      motionBody: 'Chaque entrée de cette collection est un vrai fichier H.264 de six secondes. Regardez-le ici, ou emportez le MP4.',
    },
    credits: {
      title: 'Crédits photographiques',
      lede: "Les 108 nouveaux films partent d'une photographie réelle, issue de Wikimedia Commons et d'Openverse ; les 16 premiers ont été générés avec MiniMax. Les auteurs et les licences sont listés ci-dessous, parce que ces licences l'exigent.",
      note: "Les images sont utilisées selon les termes de leurs propres licences. Le mouvement a été généré par MiniMax Hailuo-2.3 à partir de ces premières images ; le texte a été composé localement.",
      count: '{n} photographies créditées',
      empty: "Aucune liste de crédits n'a encore été publiée.",
      license: 'Licence',
      source: 'Source',
    },
    footer: {
      tagline: 'Athar — six secondes de lumière.',
      note: 'Construit dans le navigateur. Pas de serveur, pas de compte, pas de pistage.',
      backToTop: 'Haut de page',
    },
  },
};

export const COPY: Record<Lang, Copy> = {

  ar: {
    dir: 'rtl',
    date: (d) => new Intl.DateTimeFormat('ar', { weekday: 'long', day: 'numeric', month: 'long' }).format(d),
    homeQ: 'ماذا تريد أن تشارك اليوم؟',
    homeSub: 'تحدّث بضع كلمات، ونصنع لك قصّة.',
    mic: 'تحدّث الآن',
    listening: 'أُنصت…',
    chips: { gratitude: 'شكر', verse: 'آية', dua: 'دعاء' },
    write: 'أو اكتب بضع كلمات',
    placeholder: 'اكتب ما تريد أن تشاركه…',
    send: 'اصنع',
    note: 'قصّة واحدة كل يوم. بلا عجلة.',
    today: 'أو شاهد قصّة اليوم',
    takesTitle: 'عشرة أساليب',
    takesSub: 'القصّة نفسها. اختر ما يشبه قلبك.',
    choose: 'اختر',
    publish: 'انشر إلى واتساب',
    change: 'غيّر الآية',
    previewNote: 'تُحفظ في حالتك ٢٤ ساعة.',
    preparing: 'نُجهّز القصّة…',
    ready: 'جاهزة — اختر واتساب ثم «حالتي».',
    downloaded: 'تم حفظ الفيديو.',
    speakUnavailable: 'الميكروفون غير متاح — اكتب بضع كلمات.',
    errEncode: 'تعذّر إنشاء الفيديو على هذا المتصفح.',
    errUnsupported: 'هذا المتصفح لا يستطيع إنشاء الفيديو — افتح أثَر في كروم أو سفاري.',
    back: 'رجوع',
    switchTo: 'التبديل إلى الإنجليزية',
    shareText: 'قصّة اليوم من أثَر',
    site: SITE_COPY.ar,
    looks: {
      sakina: { n: 'سكينة', d: 'نورٌ هادئ، وآيةٌ تُطمئن القلب.' },
      dhahab: { n: 'ذهب', d: 'ضوءٌ دافئ، وشكرٌ يلمع كالذهب.' },
      hibr: { n: 'حبر', d: 'سكونٌ وحرفٌ واحد، بلا حركة.' },
      fajr: { n: 'فجر', d: 'سماءٌ تتفتّح، وضوءٌ يصعد من الأفق.' },
      layl: { n: 'ليل', d: 'نجومٌ ساكنة، وسكونٌ بلا قمر.' },
      nur: { n: 'نور', d: 'زخرفةٌ تدور ببطء كشمعة.' },
      bustan: { n: 'بستان', d: 'عريشٌ أخضر، وأغصانٌ على الجدار.' },
      raml: { n: 'رمل', d: 'كثبانٌ دافئة، وضوءٌ على الرمل.' },
      bahr: { n: 'بحر', d: 'ماءٌ هادئ، وخطوطٌ تتنفّس.' },
      waraq: { n: 'ورق', d: 'صفحةٌ كريمية، وحبرٌ أسود.' },
    },
  },
  en: {
    dir: 'ltr',
    date: (d) => new Intl.DateTimeFormat('en', { weekday: 'long', day: 'numeric', month: 'long' }).format(d),
    homeQ: 'What would you like to share today?',
    homeSub: 'Speak a few words and we will compose a story.',
    mic: 'Speak now',
    listening: 'Listening…',
    chips: { gratitude: 'Gratitude', verse: 'Verse', dua: 'Dua' },
    write: 'Or type a few words',
    placeholder: 'Type what you want to share…',
    send: 'Compose',
    note: 'One story a day. No rush.',
    today: 'Or see today’s story',
    takesTitle: 'Ten styles',
    takesSub: 'The same story. Choose the one that feels like you.',
    choose: 'Choose',
    publish: 'Publish to WhatsApp',
    change: 'Change the verse',
    previewNote: 'Saved to your status for 24 hours.',
    preparing: 'Preparing your story…',
    ready: 'Ready — choose WhatsApp, then Status.',
    downloaded: 'Video saved.',
    speakUnavailable: 'Microphone unavailable — type a few words.',
    errEncode: 'Could not create the video in this browser.',
    errUnsupported: 'This browser cannot create video — open Athar in Chrome or Safari.',
    back: 'Back',
    switchTo: 'Switch to French',
    shareText: 'Today’s story from Athar',
    site: SITE_COPY.en,
    looks: {
      sakina: { n: 'Sakina', d: 'Quiet light, and a verse that settles the heart.' },
      dhahab: { n: 'Dhahab', d: 'Warm light, and gratitude that shines like gold.' },
      hibr: { n: 'Hibr', d: 'Stillness and a single letterform. No motion.' },
      fajr: { n: 'Fajr', d: 'A sky opening, light climbing off the horizon.' },
      layl: { n: 'Layl', d: 'Still stars, and a night without a moon.' },
      nur: { n: 'Nur', d: 'A lamp made of ornament, turning slowly.' },
      bustan: { n: 'Bustan', d: 'A green arbour, vines drawn on the wall.' },
      raml: { n: 'Raml', d: 'Warm dunes, and light lying on the sand.' },
      bahr: { n: 'Bahr', d: 'Still water, and lines that breathe.' },
      waraq: { n: 'Waraq', d: 'A cream page, and black ink.' },
    },
  },
  fr: {
    dir: 'ltr',
    date: (d) => new Intl.DateTimeFormat('fr', { weekday: 'long', day: 'numeric', month: 'long' }).format(d),
    homeQ: 'Que souhaitez-vous partager aujourd’hui ?',
    homeSub: 'Dites quelques mots, nous composons une histoire.',
    mic: 'Parlez maintenant',
    listening: 'J’écoute…',
    chips: { gratitude: 'Gratitude', verse: 'Verset', dua: 'Invocation' },
    write: 'Ou écrire quelques mots',
    placeholder: 'Écrivez ce que vous voulez partager…',
    send: 'Créer',
    note: 'Une histoire par jour. Sans hâte.',
    today: 'Ou voir l’histoire du jour',
    takesTitle: 'Dix styles',
    takesSub: 'La même histoire. Choisissez celle qui vous ressemble.',
    choose: 'Choisir',
    publish: 'Publier sur WhatsApp',
    change: 'Changer le verset',
    previewNote: 'Conservée 24 h dans votre statut.',
    preparing: 'Préparation de votre histoire…',
    ready: 'Prête — choisissez WhatsApp, puis Statut.',
    downloaded: 'Vidéo enregistrée.',
    speakUnavailable: 'Micro indisponible — écrivez quelques mots.',
    errEncode: 'Impossible de créer la vidéo dans ce navigateur.',
    errUnsupported: 'Ce navigateur ne peut pas créer de vidéo — ouvrez Athar dans Chrome ou Safari.',
    back: 'Retour',
    switchTo: 'Passer à l’arabe',
    shareText: 'L’histoire du jour, par Athar',
    site: SITE_COPY.fr,
    looks: {
      sakina: { n: 'Sakina', d: 'Une lumière calme, un verset qui apaise le cœur.' },
      dhahab: { n: 'Dhahab', d: 'Une lumière chaude, une gratitude qui brille comme l’or.' },
      hibr: { n: 'Hibr', d: 'Le silence et une seule lettre. Aucun mouvement.' },
      fajr: { n: 'Fajr', d: 'Un ciel qui s’ouvre, la lumière monte de l’horizon.' },
      layl: { n: 'Layl', d: 'Des étoiles immobiles, une nuit sans lune.' },
      nur: { n: 'Nur', d: 'Une lampe d’ornement, qui tourne lentement.' },
      bustan: { n: 'Bustan', d: 'Une treille verte, des rinceaux sur le mur.' },
      raml: { n: 'Raml', d: 'Des dunes chaudes, la lumière posée sur le sable.' },
      bahr: { n: 'Bahr', d: 'Une eau calme, des lignes qui respirent.' },
      waraq: { n: 'Waraq', d: 'Une page crème, et de l’encre noire.' },
    },
  },
};

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const OUT =
  process.argv[2] ?? new URL("../extension/public/_locales", import.meta.url).pathname;

/** Translator-facing notes, emitted only into the English base file. */
const notes = {
  extDescription:
    "Chrome Web Store summary shown under the item name. HARD LIMIT 132 characters in every locale.",
  modeOff:
    "Mode tile label. Keep under ~10 characters — it sits in a narrow 4-column grid.",
  modeDark: "Mode tile label. Keep short, see modeOff.",
  modeSepia: "Mode tile label. Keep short, see modeOff.",
  modeGrayscale: "Mode tile label. Keep short, see modeOff.",
  controlWarmth:
    "Slider label. Adds a sepia tint to cut blue light; not literally 'temperature'.",
  hintContrast:
    "Tooltip. Lowering contrast lifts pure black towards grey and takes the glare off white text.",
  noticeAlreadyDark:
    "Shown when the user has Dark switched on over a page that is already dark.",
  pillAlreadyDark: "Badge in the popup header. Very short — under 16 characters.",
  pillHasDarkTheme: "Badge in the popup header. Very short — under 16 characters.",
};

const locales = {
  en: {
    extDescription:
      "Dark mode for websites that don't have one. Dark, sepia and grayscale, with brightness and warmth controls for night reading.",
    sectionDisplayMode: "Display mode",
    modeOff: "Off",
    modeDark: "Dark",
    modeSepia: "Sepia",
    modeGrayscale: "Gray",
    sectionAppearance: "Appearance",
    actionReset: "Reset",
    controlBrightness: "Brightness",
    controlContrast: "Contrast",
    controlWarmth: "Warmth",
    hintBrightness: "Dims the page",
    hintContrast: "Softens pure black and white",
    hintWarmth: "Cuts blue light",
    appearanceScope: "Applies to every site.",
    noticeUnsupported: "This page can't be themed by extensions.",
    noticeTabError: "Could not read the current tab.",
    noticeSaveFailed: "Could not save your preference. Please try again.",
    pillAlreadyDark: "Already dark",
    pillAlreadyDarkTitle: "This site is rendering its own dark theme",
    pillHasDarkTheme: "Has dark theme",
    pillHasDarkThemeTitle:
      "This site ships its own dark theme. Its own setting will look better than a colour filter.",
    noticeAlreadyDark:
      "This page is already dark. Inverting it will turn it light — Off usually looks better here.",
    badgeTitleAlreadyDark:
      "Dark Mode Enabler — this site already has its own dark theme",
    footerDevelopedBy: "Developed by",
  },

  es: {
    extDescription:
      "Modo oscuro para sitios que no lo tienen. Oscuro, sepia y escala de grises, con controles de brillo y calidez.",
    sectionDisplayMode: "Modo de visualización",
    modeOff: "Apagado",
    modeDark: "Oscuro",
    modeSepia: "Sepia",
    modeGrayscale: "Grises",
    sectionAppearance: "Apariencia",
    actionReset: "Restablecer",
    controlBrightness: "Brillo",
    controlContrast: "Contraste",
    controlWarmth: "Calidez",
    hintBrightness: "Atenúa la página",
    hintContrast: "Suaviza el negro y el blanco puros",
    hintWarmth: "Reduce la luz azul",
    appearanceScope: "Se aplica a todos los sitios.",
    noticeUnsupported: "Las extensiones no pueden modificar esta página.",
    noticeTabError: "No se pudo leer la pestaña actual.",
    noticeSaveFailed: "No se pudo guardar tu preferencia. Inténtalo de nuevo.",
    pillAlreadyDark: "Ya es oscuro",
    pillAlreadyDarkTitle: "Este sitio ya muestra su propio tema oscuro",
    pillHasDarkTheme: "Tiene tema oscuro",
    pillHasDarkThemeTitle:
      "Este sitio incluye su propio tema oscuro. Su ajuste se verá mejor que un filtro de color.",
    noticeAlreadyDark:
      "Esta página ya es oscura. Invertirla la volverá clara: aquí suele verse mejor con Apagado.",
    badgeTitleAlreadyDark:
      "Dark Mode Enabler: este sitio ya tiene su propio tema oscuro",
    footerDevelopedBy: "Desarrollado por",
  },

  pt_BR: {
    extDescription:
      "Modo escuro para sites que não têm um. Escuro, sépia e tons de cinza, com controles de brilho e calidez.",
    sectionDisplayMode: "Modo de exibição",
    modeOff: "Desligado",
    modeDark: "Escuro",
    modeSepia: "Sépia",
    modeGrayscale: "Cinza",
    sectionAppearance: "Aparência",
    actionReset: "Redefinir",
    controlBrightness: "Brilho",
    controlContrast: "Contraste",
    controlWarmth: "Calidez",
    hintBrightness: "Escurece a página",
    hintContrast: "Suaviza o preto e o branco puros",
    hintWarmth: "Reduz a luz azul",
    appearanceScope: "Aplica-se a todos os sites.",
    noticeUnsupported: "As extensões não podem alterar esta página.",
    noticeTabError: "Não foi possível ler a aba atual.",
    noticeSaveFailed:
      "Não foi possível salvar sua preferência. Tente novamente.",
    pillAlreadyDark: "Já é escuro",
    pillAlreadyDarkTitle: "Este site já exibe o próprio tema escuro",
    pillHasDarkTheme: "Tem tema escuro",
    pillHasDarkThemeTitle:
      "Este site inclui o próprio tema escuro. A configuração dele ficará melhor que um filtro de cor.",
    noticeAlreadyDark:
      "Esta página já é escura. Invertê-la deixará clara — aqui costuma ficar melhor com Desligado.",
    badgeTitleAlreadyDark:
      "Dark Mode Enabler — este site já tem o próprio tema escuro",
    footerDevelopedBy: "Desenvolvido por",
  },

  ru: {
    extDescription:
      "Тёмная тема для сайтов, у которых её нет. Тёмный, сепия и оттенки серого, с настройкой яркости и теплоты.",
    sectionDisplayMode: "Режим отображения",
    modeOff: "Выкл.",
    modeDark: "Тёмный",
    modeSepia: "Сепия",
    modeGrayscale: "Серый",
    sectionAppearance: "Оформление",
    actionReset: "Сбросить",
    controlBrightness: "Яркость",
    controlContrast: "Контраст",
    controlWarmth: "Теплота",
    hintBrightness: "Приглушает страницу",
    hintContrast: "Смягчает чистый чёрный и белый",
    hintWarmth: "Снижает синий свет",
    appearanceScope: "Применяется ко всем сайтам.",
    noticeUnsupported: "Расширения не могут изменять эту страницу.",
    noticeTabError: "Не удалось прочитать текущую вкладку.",
    noticeSaveFailed: "Не удалось сохранить настройку. Попробуйте ещё раз.",
    pillAlreadyDark: "Уже тёмный",
    pillAlreadyDarkTitle: "На этом сайте уже включена своя тёмная тема",
    pillHasDarkTheme: "Есть тёмная тема",
    pillHasDarkThemeTitle:
      "У сайта есть своя тёмная тема. Его собственная настройка выглядит лучше цветового фильтра.",
    noticeAlreadyDark:
      "Страница уже тёмная. Инверсия сделает её светлой — здесь лучше выбрать «Выкл.».",
    badgeTitleAlreadyDark:
      "Dark Mode Enabler — у этого сайта уже есть своя тёмная тема",
    footerDevelopedBy: "Разработано",
  },

  de: {
    extDescription:
      "Dunkelmodus für Websites ohne eigenen. Dunkel, Sepia und Graustufen, mit Helligkeits- und Wärmereglern.",
    sectionDisplayMode: "Anzeigemodus",
    modeOff: "Aus",
    modeDark: "Dunkel",
    modeSepia: "Sepia",
    modeGrayscale: "Grau",
    sectionAppearance: "Darstellung",
    actionReset: "Zurücksetzen",
    controlBrightness: "Helligkeit",
    controlContrast: "Kontrast",
    controlWarmth: "Wärme",
    hintBrightness: "Dimmt die Seite",
    hintContrast: "Mildert reines Schwarz und Weiß",
    hintWarmth: "Reduziert blaues Licht",
    appearanceScope: "Gilt für alle Websites.",
    noticeUnsupported: "Erweiterungen können diese Seite nicht anpassen.",
    noticeTabError: "Der aktuelle Tab konnte nicht gelesen werden.",
    noticeSaveFailed:
      "Einstellung konnte nicht gespeichert werden. Bitte erneut versuchen.",
    pillAlreadyDark: "Schon dunkel",
    pillAlreadyDarkTitle: "Diese Website zeigt bereits ihr eigenes dunkles Design",
    pillHasDarkTheme: "Hat dunkles Design",
    pillHasDarkThemeTitle:
      "Diese Website bringt ein eigenes dunkles Design mit. Deren Einstellung sieht besser aus als ein Farbfilter.",
    noticeAlreadyDark:
      "Diese Seite ist bereits dunkel. Invertieren macht sie hell — hier ist „Aus“ meist besser.",
    badgeTitleAlreadyDark:
      "Dark Mode Enabler — diese Website hat bereits ihr eigenes dunkles Design",
    footerDevelopedBy: "Entwickelt von",
  },

  fr: {
    extDescription:
      "Mode sombre pour les sites qui n'en ont pas. Sombre, sépia et niveaux de gris, avec luminosité et chaleur.",
    sectionDisplayMode: "Mode d'affichage",
    modeOff: "Arrêt",
    modeDark: "Sombre",
    modeSepia: "Sépia",
    modeGrayscale: "Gris",
    sectionAppearance: "Apparence",
    actionReset: "Réinitialiser",
    controlBrightness: "Luminosité",
    controlContrast: "Contraste",
    controlWarmth: "Chaleur",
    hintBrightness: "Assombrit la page",
    hintContrast: "Adoucit le noir et le blanc purs",
    hintWarmth: "Réduit la lumière bleue",
    appearanceScope: "S'applique à tous les sites.",
    noticeUnsupported: "Les extensions ne peuvent pas modifier cette page.",
    noticeTabError: "Impossible de lire l'onglet actuel.",
    noticeSaveFailed: "Impossible d'enregistrer votre préférence. Réessayez.",
    pillAlreadyDark: "Déjà sombre",
    pillAlreadyDarkTitle: "Ce site affiche déjà son propre thème sombre",
    pillHasDarkTheme: "Thème sombre",
    pillHasDarkThemeTitle:
      "Ce site propose son propre thème sombre. Son réglage sera meilleur qu'un filtre de couleur.",
    noticeAlreadyDark:
      "Cette page est déjà sombre. L'inverser la rendra claire — « Arrêt » convient mieux ici.",
    badgeTitleAlreadyDark:
      "Dark Mode Enabler — ce site a déjà son propre thème sombre",
    footerDevelopedBy: "Développé par",
  },

  it: {
    extDescription:
      "Modalità scura per i siti che non ce l'hanno. Scuro, seppia e scala di grigi, con luminosità e calore.",
    sectionDisplayMode: "Modalità di visualizzazione",
    modeOff: "Off",
    modeDark: "Scuro",
    modeSepia: "Seppia",
    modeGrayscale: "Grigio",
    sectionAppearance: "Aspetto",
    actionReset: "Reimposta",
    controlBrightness: "Luminosità",
    controlContrast: "Contrasto",
    controlWarmth: "Calore",
    hintBrightness: "Attenua la pagina",
    hintContrast: "Ammorbidisce il nero e il bianco puri",
    hintWarmth: "Riduce la luce blu",
    appearanceScope: "Si applica a tutti i siti.",
    noticeUnsupported: "Le estensioni non possono modificare questa pagina.",
    noticeTabError: "Impossibile leggere la scheda corrente.",
    noticeSaveFailed: "Impossibile salvare la preferenza. Riprova.",
    pillAlreadyDark: "Già scuro",
    pillAlreadyDarkTitle: "Questo sito mostra già il proprio tema scuro",
    pillHasDarkTheme: "Ha tema scuro",
    pillHasDarkThemeTitle:
      "Questo sito include un tema scuro. La sua impostazione sarà migliore di un filtro colore.",
    noticeAlreadyDark:
      "Questa pagina è già scura. Invertirla la renderà chiara: qui è meglio Off.",
    badgeTitleAlreadyDark:
      "Dark Mode Enabler — questo sito ha già il proprio tema scuro",
    footerDevelopedBy: "Sviluppato da",
  },

  ja: {
    extDescription:
      "ダークモードのないサイトを暗くします。ダーク・セピア・グレースケール、明るさと暖かさの調整付き。",
    sectionDisplayMode: "表示モード",
    modeOff: "オフ",
    modeDark: "ダーク",
    modeSepia: "セピア",
    modeGrayscale: "グレー",
    sectionAppearance: "外観",
    actionReset: "リセット",
    controlBrightness: "明るさ",
    controlContrast: "コントラスト",
    controlWarmth: "暖かさ",
    hintBrightness: "ページを暗くします",
    hintContrast: "純粋な黒と白をやわらげます",
    hintWarmth: "ブルーライトを減らします",
    appearanceScope: "すべてのサイトに適用されます。",
    noticeUnsupported: "このページは拡張機能で変更できません。",
    noticeTabError: "現在のタブを読み取れませんでした。",
    noticeSaveFailed: "設定を保存できませんでした。もう一度お試しください。",
    pillAlreadyDark: "すでにダーク",
    pillAlreadyDarkTitle: "このサイトは独自のダークテーマを表示しています",
    pillHasDarkTheme: "ダークテーマあり",
    pillHasDarkThemeTitle:
      "このサイトには独自のダークテーマがあります。サイト側の設定のほうがきれいに表示されます。",
    noticeAlreadyDark:
      "このページはすでに暗いため、反転すると明るくなります。ここでは「オフ」が適しています。",
    badgeTitleAlreadyDark:
      "Dark Mode Enabler — このサイトには独自のダークテーマがあります",
    footerDevelopedBy: "開発者",
  },

  ko: {
    extDescription:
      "다크 모드가 없는 사이트를 어둡게. 다크, 세피아, 흑백 모드와 밝기·따뜻함 조절을 제공합니다.",
    sectionDisplayMode: "표시 모드",
    modeOff: "끄기",
    modeDark: "다크",
    modeSepia: "세피아",
    modeGrayscale: "흑백",
    sectionAppearance: "화면 설정",
    actionReset: "초기화",
    controlBrightness: "밝기",
    controlContrast: "대비",
    controlWarmth: "따뜻함",
    hintBrightness: "페이지를 어둡게 합니다",
    hintContrast: "완전한 검정과 흰색을 부드럽게 합니다",
    hintWarmth: "청색광을 줄입니다",
    appearanceScope: "모든 사이트에 적용됩니다.",
    noticeUnsupported: "확장 프로그램이 이 페이지를 변경할 수 없습니다.",
    noticeTabError: "현재 탭을 읽을 수 없습니다.",
    noticeSaveFailed: "설정을 저장하지 못했습니다. 다시 시도해 주세요.",
    pillAlreadyDark: "이미 다크",
    pillAlreadyDarkTitle: "이 사이트는 자체 다크 테마를 표시하고 있습니다",
    pillHasDarkTheme: "다크 테마 있음",
    pillHasDarkThemeTitle:
      "이 사이트에는 자체 다크 테마가 있습니다. 사이트 설정이 색상 필터보다 보기 좋습니다.",
    noticeAlreadyDark:
      "이 페이지는 이미 어둡습니다. 반전하면 밝아지므로 여기서는 끄기가 좋습니다.",
    badgeTitleAlreadyDark:
      "Dark Mode Enabler — 이 사이트에는 이미 자체 다크 테마가 있습니다",
    footerDevelopedBy: "개발자",
  },

  zh_CN: {
    extDescription:
      "为没有深色模式的网站提供深色模式。深色、棕褐色和灰度，并可调节亮度与暖色。",
    sectionDisplayMode: "显示模式",
    modeOff: "关闭",
    modeDark: "深色",
    modeSepia: "棕褐",
    modeGrayscale: "灰度",
    sectionAppearance: "外观",
    actionReset: "重置",
    controlBrightness: "亮度",
    controlContrast: "对比度",
    controlWarmth: "暖色",
    hintBrightness: "调暗页面",
    hintContrast: "柔化纯黑与纯白",
    hintWarmth: "减少蓝光",
    appearanceScope: "适用于所有网站。",
    noticeUnsupported: "扩展程序无法修改此页面。",
    noticeTabError: "无法读取当前标签页。",
    noticeSaveFailed: "无法保存偏好设置，请重试。",
    pillAlreadyDark: "已是深色",
    pillAlreadyDarkTitle: "该网站已在使用自己的深色主题",
    pillHasDarkTheme: "有深色主题",
    pillHasDarkThemeTitle:
      "该网站自带深色主题。使用网站自身的设置会比颜色滤镜更好看。",
    noticeAlreadyDark:
      "此页面已是深色，反转会让它变亮。这里通常选择“关闭”更合适。",
    badgeTitleAlreadyDark: "Dark Mode Enabler — 该网站已自带深色主题",
    footerDevelopedBy: "开发者",
  },

  tr: {
    extDescription:
      "Koyu modu olmayan siteler için koyu mod. Koyu, sepya ve gri tonlama; parlaklık ve sıcaklık ayarlarıyla.",
    sectionDisplayMode: "Görünüm modu",
    modeOff: "Kapalı",
    modeDark: "Koyu",
    modeSepia: "Sepya",
    modeGrayscale: "Gri",
    sectionAppearance: "Görünüm",
    actionReset: "Sıfırla",
    controlBrightness: "Parlaklık",
    controlContrast: "Kontrast",
    controlWarmth: "Sıcaklık",
    hintBrightness: "Sayfayı karartır",
    hintContrast: "Saf siyah ve beyazı yumuşatır",
    hintWarmth: "Mavi ışığı azaltır",
    appearanceScope: "Tüm sitelere uygulanır.",
    noticeUnsupported: "Uzantılar bu sayfayı değiştiremez.",
    noticeTabError: "Geçerli sekme okunamadı.",
    noticeSaveFailed: "Tercihiniz kaydedilemedi. Lütfen tekrar deneyin.",
    pillAlreadyDark: "Zaten koyu",
    pillAlreadyDarkTitle: "Bu site kendi koyu temasını gösteriyor",
    pillHasDarkTheme: "Koyu teması var",
    pillHasDarkThemeTitle:
      "Bu sitenin kendi koyu teması var. Sitenin kendi ayarı renk filtresinden daha iyi görünür.",
    noticeAlreadyDark:
      "Bu sayfa zaten koyu. Ters çevirmek onu aydınlatır — burada Kapalı daha iyi görünür.",
    badgeTitleAlreadyDark:
      "Dark Mode Enabler — bu sitenin kendi koyu teması zaten var",
    footerDevelopedBy: "Geliştiren",
  },

  pl: {
    extDescription:
      "Tryb ciemny dla stron, które go nie mają. Ciemny, sepia i odcienie szarości, z regulacją jasności i ciepła.",
    sectionDisplayMode: "Tryb wyświetlania",
    modeOff: "Wył.",
    modeDark: "Ciemny",
    modeSepia: "Sepia",
    modeGrayscale: "Szary",
    sectionAppearance: "Wygląd",
    actionReset: "Resetuj",
    controlBrightness: "Jasność",
    controlContrast: "Kontrast",
    controlWarmth: "Ciepło",
    hintBrightness: "Przyciemnia stronę",
    hintContrast: "Łagodzi czystą czerń i biel",
    hintWarmth: "Ogranicza niebieskie światło",
    appearanceScope: "Dotyczy wszystkich stron.",
    noticeUnsupported: "Rozszerzenia nie mogą zmienić tej strony.",
    noticeTabError: "Nie udało się odczytać bieżącej karty.",
    noticeSaveFailed: "Nie udało się zapisać ustawienia. Spróbuj ponownie.",
    pillAlreadyDark: "Już ciemna",
    pillAlreadyDarkTitle: "Ta strona wyświetla własny ciemny motyw",
    pillHasDarkTheme: "Ma ciemny motyw",
    pillHasDarkThemeTitle:
      "Ta strona ma własny ciemny motyw. Jej ustawienie wygląda lepiej niż filtr kolorów.",
    noticeAlreadyDark:
      "Ta strona jest już ciemna. Odwrócenie ją rozjaśni — lepiej wybrać Wył.",
    badgeTitleAlreadyDark:
      "Dark Mode Enabler — ta strona ma już własny ciemny motyw",
    footerDevelopedBy: "Autor",
  },

  id: {
    extDescription:
      "Mode gelap untuk situs yang belum punya. Gelap, sepia, dan skala abu-abu, dengan kontrol kecerahan dan kehangatan.",
    sectionDisplayMode: "Mode tampilan",
    modeOff: "Mati",
    modeDark: "Gelap",
    modeSepia: "Sepia",
    modeGrayscale: "Abu-abu",
    sectionAppearance: "Tampilan",
    actionReset: "Atur ulang",
    controlBrightness: "Kecerahan",
    controlContrast: "Kontras",
    controlWarmth: "Kehangatan",
    hintBrightness: "Meredupkan halaman",
    hintContrast: "Melembutkan hitam dan putih pekat",
    hintWarmth: "Mengurangi cahaya biru",
    appearanceScope: "Berlaku untuk semua situs.",
    noticeUnsupported: "Ekstensi tidak dapat mengubah halaman ini.",
    noticeTabError: "Tidak dapat membaca tab saat ini.",
    noticeSaveFailed: "Preferensi gagal disimpan. Silakan coba lagi.",
    pillAlreadyDark: "Sudah gelap",
    pillAlreadyDarkTitle: "Situs ini sudah menampilkan tema gelapnya sendiri",
    pillHasDarkTheme: "Punya tema gelap",
    pillHasDarkThemeTitle:
      "Situs ini punya tema gelap sendiri. Pengaturannya akan terlihat lebih baik daripada filter warna.",
    noticeAlreadyDark:
      "Halaman ini sudah gelap. Membalikkannya justru membuatnya terang — pilih Mati di sini.",
    badgeTitleAlreadyDark:
      "Dark Mode Enabler — situs ini sudah punya tema gelapnya sendiri",
    footerDevelopedBy: "Dibuat oleh",
  },
};

const base = Object.keys(locales.en);
let failures = 0;

for (const [locale, strings] of Object.entries(locales)) {
  const missing = base.filter((k) => !(k in strings));
  const extra = Object.keys(strings).filter((k) => !base.includes(k));

  if (missing.length || extra.length) {
    console.error(`✖ ${locale}: missing=${missing} extra=${extra}`);
    failures += 1;
  }

  if (strings.extDescription.length > 132) {
    console.error(
      `✖ ${locale}: extDescription is ${strings.extDescription.length} chars (limit 132)`
    );
    failures += 1;
  }

  const payload = {};
  for (const key of base) {
    payload[key] = { message: strings[key] };
    if (locale === "en" && notes[key]) {
      payload[key].description = notes[key];
    }
  }

  const dir = join(OUT, locale);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "messages.json"), JSON.stringify(payload, null, 2) + "\n");
  console.log(
    `${locale.padEnd(6)} ${String(base.length).padStart(2)} strings   summary ${String(strings.extDescription.length).padStart(3)}/132`
  );
}

process.exit(failures ? 1 : 0);

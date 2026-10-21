import type { Verse } from '../engine/types';

/**
 * Curated, short, very well-known verses. The model is never allowed to
 * generate scripture — it only selects from this locked set. A scholar
 * review board must sign off on this list before public launch.
 *
 * Line breaks are deliberate: each line is one breath on screen.
 */
export const VERSES: Verse[] = [
  {
    id: 'rad-28',
    lines: ['أَلَا بِذِكْرِ اللَّهِ', 'تَطْمَئِنُّ الْقُلُوبُ'],
    sourceAr: 'سورة الرعد · ٢٨',
    sourceEn: "Ar-Ra'd 13:28",
    themes: ['remembrance', 'peace', 'قلب', 'طمأنينة', 'ذكر', 'سكينة'],
  },
  {
    id: 'baqarah-152',
    lines: ['فَاذْكُرُونِي', 'أَذْكُرْكُمْ'],
    sourceAr: 'سورة البقرة · ١٥٢',
    sourceEn: 'Al-Baqarah 2:152',
    themes: ['remembrance', 'gratitude', 'ذكر', 'شكر'],
  },
  {
    id: 'ibrahim-7',
    lines: ['لَئِن شَكَرْتُمْ', 'لَأَزِيدَنَّكُمْ'],
    sourceAr: 'سورة إبراهيم · ٧',
    sourceEn: 'Ibrahim 14:7',
    themes: ['gratitude', 'شكر', 'حمد', 'نعمة'],
  },
  {
    id: 'sharh-5',
    lines: ['فَإِنَّ مَعَ الْعُسْرِ', 'يُسْرًا'],
    sourceAr: 'سورة الشرح · ٥',
    sourceEn: 'Ash-Sharh 94:5',
    themes: ['hope', 'ease', 'hardship', 'أمل', 'فرج', 'عسر', 'يسر'],
  },
  {
    id: 'talaq-3',
    lines: ['وَمَن يَتَوَكَّلْ عَلَى اللَّهِ', 'فَهُوَ حَسْبُهُ'],
    sourceAr: 'سورة الطلاق · ٣',
    sourceEn: 'At-Talaq 65:3',
    themes: ['trust', 'tawakkul', 'توكل', 'ثقة', 'قلق'],
  },
  {
    id: 'baqarah-286',
    lines: ['لَا يُكَلِّفُ اللَّهُ نَفْسًا', 'إِلَّا وُسْعَهَا'],
    sourceAr: 'سورة البقرة · ٢٨٦',
    sourceEn: 'Al-Baqarah 2:286',
    themes: ['ease', 'hardship', 'صبر', 'هم', 'تعب'],
  },
  {
    id: 'taha-25',
    lines: ['رَبِّ اشْرَحْ لِي صَدْرِي', 'وَيَسِّرْ لِي أَمْرِي'],
    sourceAr: 'سورة طه · ٢٥',
    sourceEn: 'Ta-Ha 20:25',
    themes: ['ease', 'anxiety', 'قلق', 'ضيق', 'خوف'],
  },
  {
    id: 'baqarah-201',
    lines: ['رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً', 'وَفِي الْآخِرَةِ حَسَنَةً'],
    sourceAr: 'سورة البقرة · ٢٠١',
    sourceEn: 'Al-Baqarah 2:201',
    themes: ['dua', 'goodness', 'دعاء', 'خير'],
  },
  {
    id: 'hadid-4',
    lines: ['وَهُوَ مَعَكُمْ', 'أَيْنَ مَا كُنتُمْ'],
    sourceAr: 'سورة الحديد · ٤',
    sourceEn: 'Al-Hadid 57:4',
    themes: ['presence', 'comfort', 'وحدة', 'قرب', 'معية', 'أمي', 'أبي', 'family'],
  },
  {
    id: 'baqarah-153',
    lines: ['إِنَّ اللَّهَ', 'مَعَ الصَّابِرِينَ'],
    sourceAr: 'سورة البقرة · ١٥٣',
    sourceEn: 'Al-Baqarah 2:153',
    themes: ['patience', 'صبر', 'صابر'],
  },
];

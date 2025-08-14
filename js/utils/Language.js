/**
 * Simple language toggle system (English/Vietnamese)
 */

export class Language {
  constructor() {
    // Default to Vietnamese for mobile, English for PC
    this.currentLanguage = this.detectMobile() ? 'vi' : 'en';
    
    this.translations = {
      // UI Prompts
      'press_e_check_mail': {
        en: 'Press E to check mail',
        vi: 'Ấn E để xem thư'
      },
      'press_e_jukebox': {
        en: 'Press E for jukebox',
        vi: 'Ấn E để nghe nhạc'
      },
      'press_e_investigate': {
        en: 'Press E to investigate',
        vi: 'Ấn E để xem'
      },
      'press_e_dig': {
        en: 'Press E to Dig',
        vi: 'Ấn E để đào'
      },
      'press_e_eat_cake': {
        en: 'Press E to eat cake',
        vi: 'Ấn E để ăn bánh'
      },
      'press_e_search_trees': {
        en: 'Press E to search trees',
        vi: 'Ấn E để tìm kiếm'
      },
      'press_e_talk': {
        en: 'Press E to talk',
        vi: 'Ấn E để nói chuyện'
      },
      'birthday_mailbox': {
        en: '🎉 30 Wishes for Your 30th 🎉',
        vi: '🎉 30 điều ước cho tuổi 30 🎉'
      },
      'letter_title_30_things': {
        en: '30 Things I Love About You',
        vi: '30 điều anh yêu em'
      },
      
      // Choice Modals
      'make_choice': {
        en: 'Make a Choice',
        vi: 'Chọn đi'
      },
      'bothering_khushi': {
        en: 'Bothering Khushi',
        vi: 'Quấy rầy Khushi'
      },
      'bother_khushi_question': {
        en: 'Are you sure you want to bother Khushi again?',
        vi: 'Chắc muốn quấy rầy Khushi nữa không?'
      },
      'yes_keep_bothering': {
        en: 'Yes, keep bothering',
        vi: 'Ừa, tiếp tục quấy'
      },
      'no_leave_alone': {
        en: 'No, leave her alone',
        vi: 'Không, để yên thôi'
      },
      'nolan_request': {
        en: 'Nolan\'s Request',
        vi: 'Nolan muốn gì đó'
      },
      'let_nolan_eat': {
        en: 'Let Nolan eat the mushroom?',
        vi: 'Cho Nolan ăn nấm không?'
      },
      'yes_eat_it': {
        en: 'Yes, eat it',
        vi: 'Ừa, ăn đi'
      },
      'no_dont_eat': {
        en: 'No, don\'t eat it',
        vi: 'Không, đừng ăn'
      },
      'anne_video': {
        en: 'Anne\'s Video',
        vi: 'Video Anne'
      },
      'watch_anne_video': {
        en: 'Do you want to watch Anne\'s video?\n⚠️ WARNING: GRAPHIC CONTENT',
        vi: 'Muốn xem video Anne không?\n⚠️ CẢNH BÁO: Nội dung không phù hợp'
      },
      'yes_watch': {
        en: 'Yes, watch',
        vi: 'Ừa, xem'
      },
      'no_skip': {
        en: 'No, skip',
        vi: 'Không, thôi'
      },
      'yes': {
        en: 'Yes',
        vi: 'Ừa'
      },
      'no': {
        en: 'No',
        vi: 'Không'
      },
      
      // Dialog messages
      'dialog_roti_1': {
        en: "Thank you for adopting me, despite what papa said about my ugly nose!",
        vi: "Cảm ơn vì đã nhận nuôi con, mặc dù ba nói mũi con xấu!"
      },
      'dialog_roti_2': {
        en: "I'm sorry I dug up your vegetables. You should go check those empty spots out!",
        vi: "Con xin lỗi vì đã đào phá vườn. Hãy đi xem những chỗ trống đó đi!"
      },
      'dialog_roti_3': {
        en: "Can I crawl inside you?!",
        vi: "Con có thể chui vào bụng bạn không?!"
      },
      'dialog_roti_4': {
        en: "I just pissed and pooped on the rug inside!",
        vi: "Con vừa đi tè và ị lên thảm trong nhà!"
      },
      'dialog_khushi_1': {
        en: "hmm? is something special about today?",
        vi: "hửm? hôm nay có gì đặc biệt không?"
      },
      'dialog_khushi_2': {
        en: "sup?",
        vi: "sao vậy?"
      },
      'dialog_khushi_3': {
        en: "um, can you give me some space?",
        vi: "ừm... cho tôi một chút không gian được không?"
      },
      'dialog_khushi_4': {
        en: "...",
        vi: "..."
      },
      'dialog_danoonie_1': {
        en: "Don't move or else I'll stop singing and we have to start this all over again & torture our guests.",
        vi: "Đừng cử động gì hết, không anh ngừng hát và mình phải làm lại từ đầu rồi khách khổ."
      },
      'dialog_danoonie_2': {
        en: "I am your farm husband! I just stand here all day and watch you farm - realistic right?",
        vi: "Anh là ông chồng nông trại của em! Chỉ đứng đây cả ngày ngắm em làm ruộng - thực tế đúng không?"
      },
      'dialog_danoonie_3': {
        en: "Wanna see something cool? Press ; to see the collision boxes that prevent you from bumping into things!",
        vi: "Muốn xem cái gì hay không? Ấn ; để xem những cái khung va chạm ngăn em đụng phải đồ đạc!"
      },
      'dialog_danoonie_4': {
        en: "I love you! Happy birthday Lindo.",
        vi: "Anh yêu em! Chúc mừng sinh nhật Lindo."
      },
      'dialog_raza_1': {
        en: "This isn't as nice as a river but I still appreciate the view.",
        vi: "Chỗ này không đẹp bằng sông, nhưng cảnh cũng ổn."
      },
      'dialog_daninja_1': {
        en: "I trained in these very trees for years. Now I emerge for your special day to deliver this letter from Danoonie!",
        vi: "Tao đã luyện tập trong những cây này nhiều năm. Hôm nay tao xuất hiện trong ngày đặc biệt của mày để gửi lá thư này từ Danoonie!"
      },
      'dialog_madeline_1': {
        en: "Despite you never watering me, I still somehow grew to be healthy, thank you for nothing & happy birthday!!",
        vi: "Mặc dù không bao giờ tưới nước cho tôi, tôi vẫn lớn khỏe mạnh, cảm ơn vì không làm gì & chúc mừng sinh nhật!!"
      },
      'dialog_nolan_1': {
        en: "I am going to eat this *gobble* *gobble*",
        vi: "Tao sẽ ăn cái này *nhai nhai* *nhai nhai*"
      },
      'dialog_anne_1': {
        en: "HOLY FUCK GIRL ITS YOUR BDAY! I MADE YOU SOMETHING REALLY COOL WANNA SEE?",
        vi: "TRỜI ƠI CON BÉ HÔM NAY SINH NHẬT! TÔI ĐÃ LÀM CHO CON MỘT THỨ CỰC HAY MUỐN XEM KHÔNG?"
      },
      'dialog_bo_1': {
        en: "Thương con, mẹ gọt trái ngọt, trao từng miếng yêu thương.",
        vi: "Thương con, mẹ gọt trái ngọt, trao từng miếng yêu thương."
      },
      'dialog_me_1': {
        en: "Sinh nhật vui vẻ, nhớ ăn rau nhé con!",
        vi: "Sinh nhật vui vẻ, nhớ ăn rau nhé con!"
      },
      'dialog_nat_1': {
        en: "Happy Birthday! Did you check the well for the present I got you?",
        vi: "Chúc mừng sinh nhật! Đã kiểm tra giếng tìm món quà anh mua cho em chưa?"
      },
      'dialog_nat_2': {
        en: "I can't believe you ate that entire cake that I got for you!",
        vi: "Không tin nổi em ăn hết cái bánh mà anh mua cho em!"
      },
      'dialog_khoa_1': {
        en: "Hey sister! I've been working real hard on the right words to say to you and this is what I have so far: 'live, laugh, love!'",
        vi: "Chào chị! Anh nghĩ mãi không biết nói gì với chị, cuối cùng nghĩ ra được: 'sống, cười, yêu!'"
      }
    };
  }
  
  /**
   * Detect if user is on mobile device
   */
  detectMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           ('ontouchstart' in window && navigator.maxTouchPoints > 0);
  }
  
  /**
   * Toggle language between English and Vietnamese
   */
  toggle() {
    this.currentLanguage = this.currentLanguage === 'en' ? 'vi' : 'en';
  }
  
  /**
   * Get current language
   * @returns {string} Current language code
   */
  getCurrentLanguage() {
    return this.currentLanguage;
  }
  
  /**
   * Get translated text
   * @param {string} key - Translation key
   * @returns {string} Translated text
   */
  t(key) {
    const translation = this.translations[key];
    if (!translation) {
      console.warn(`Translation missing for key: ${key}`);
      return key;
    }
    return translation[this.currentLanguage] || translation.en || key;
  }
}

// Export singleton instance
export const language = new Language();
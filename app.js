// 🔥 تكسي العراق الشامل - إدارة الدخول والداتا الأساسية
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getDatabase, ref, set, get, child, update } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

// إعدادات Firebase الأصلية
const firebaseConfig = {
  apiKey: "AIzaSyBZy7GTKn62CqeXAgm2fLrXI67P4Lc4Q3M",
  authDomain: "taxi-15314.firebaseapp.com",
  databaseURL: "https://taxi-15314-default-rtdb.firebaseio.com/",
  projectId: "taxi-15314"
};

// بدء الاتصال بفايربيس
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// 🟢 التحقق من تسجيل الدخول مسبقًا
const savedPhone = localStorage.getItem("phone");
const savedType = localStorage.getItem("userType");
if (savedPhone && savedType) {
  redirect(savedType);
}

// 🔹 دالة الدخول
window.login = function(type) {
  const phone = document.getElementById("phone").value.trim();
  if (!phone) { alert("الرجاء إدخال رقم الهاتف"); return; }

  const dbRef = ref(db);
  get(child(dbRef, "users/" + phone)).then(snapshot => {
    const now = new Date();
    const expireAt = new Date();
    expireAt.setDate(now.getDate() + 30); // تفعيل 30 يوم افتراضيًا

    // ✅ إذا المستخدم موجود
    if (snapshot.exists()) {
      const user = snapshot.val();

      // 🚫 تحقق من حالة الحظر
      if (user.banned) {
        alert("🚫 هذا الحساب محظور من قبل الإدارة\n📍 موقعك الحالي تم حفظه تلقائيًا في النظام.");
        try {
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(pos => {
              const { latitude, longitude } = pos.coords;
              set(ref(db, "banned_locations/" + phone), {
                lat: latitude,
                lng: longitude,
                time: new Date().toISOString()
              });
            });
          }
          // 🔊 تنبيه صوتي قصير
          const ctx = new (window.AudioContext || window.webkitAudioContext)();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.value = 700;
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          setTimeout(() => osc.stop(), 400);
        } catch (e) {}
        return; // لا يسمح بالدخول
      }

      // ⏳ تحقق من صلاحية السائق
      if (user.type === "driver" && user.expireAt) {
        const exp = new Date(user.expireAt);
        if (now > exp) {
          alert("⛔ انتهت صلاحية الحساب، الرجاء مراجعة الإدارة لتجديد التفعيل.");
          return;
        }
      }

      // 🔄 تحديث النوع إن تغيّر
      update(ref(db, "users/" + phone), { type });
      localStorage.setItem("phone", phone);
      localStorage.setItem("userType", type);
      redirect(type);
    } 
    // 🆕 إذا لم يكن موجودًا → إنشاء جديد
    else {
      set(ref(db, "users/" + phone), {
        phone,
        type,
        createdAt: now.toISOString(),
        banned: false,
        expireAt: expireAt.toISOString()
      }).then(() => {
        localStorage.setItem("phone", phone);
        localStorage.setItem("userType", type);
        redirect(type);
      });
    }
  });
};

// 🔸 تحويل المستخدم حسب نوعه
function redirect(type) {
  if (type === "driver") window.location.href = "driver.html";
  else if (type === "rider") window.location.href = "rider.html";
  else window.location.href = "index.html";
}

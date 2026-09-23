/**
 * ==============================================================================
 * AUTH VIEW COMPONENT (WITH REAL-TIME PASSWORD STRENGTH & SECURITY INDICATOR)
 * Design: Single Unified Hero Image Header + Extra Large Crisp Heart Avatar
 * ==============================================================================
 */

import { api, extractUsername } from '../services/api.js';
import { soundHelper } from '../utils/soundHelper.js';

export class AuthViewComponent {
  constructor(onAuthSuccess) {
    this.container = document.getElementById('auth-container');
    this.appContainer = document.getElementById('app-container');
    this.onAuthSuccess = onAuthSuccess;
    this.isSignUp = false;
    this.isLoading = false;

    this.render();
  }

  render() {
    if (!this.container) return;

    this.container.innerHTML = `
      <main class="relative z-10 w-full max-w-[430px] mx-auto min-h-screen flex flex-col justify-between bg-[#FCE5D8] overflow-hidden shadow-2xl md:my-6 md:rounded-[2.5rem] md:border md:border-[#F0EAE1]">
        
        <!-- Top Hero Section: ONE SINGLE UNIFIED FULL-WIDTH IMAGE -->
        <div class="relative w-full h-[320px] flex flex-col justify-between pt-4 px-5 z-0 overflow-hidden">
          
          <!-- Single Full-Bleed Background Image -->
          <img src="src/assets/login-bg.png" alt="OurMam Couple Hero" 
               class="absolute inset-0 w-full h-full object-cover object-center pointer-events-none z-0">

          <!-- Subtle Top Gradient -->
          <div class="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/25 via-black/10 to-transparent pointer-events-none z-10"></div>

          <!-- Brand Bar (Top-Left Aligned with EXTRA LARGE BOLD HEART LOGO) -->
          <div class="relative z-20 flex items-center gap-3">
            
            <!-- Extra Large Avatar Squircle (58px) with Big Crisp Heart -->
            <div class="w-[58px] h-[58px] rounded-2xl bg-white p-1.5 shadow-lg border-2 border-white/90 flex items-center justify-center backdrop-blur-md transform hover:scale-105 transition-transform flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="100 110 312 235" class="w-full h-full drop-shadow-md">
                <defs>
                  <linearGradient id="peachCoralBig" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#FF7A53"/>
                    <stop offset="100%" stop-color="#E85324"/>
                  </linearGradient>
                  <linearGradient id="softAmberBig" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#FFB347"/>
                    <stop offset="100%" stop-color="#FF8A3D"/>
                  </linearGradient>
                  <filter id="markGlowBig" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#E85324" flood-opacity="0.25"/>
                  </filter>
                </defs>

                <g filter="url(#markGlowBig)">
                  <!-- Left Heart Half (with Spoon Cutout) -->
                  <path d="M256 168 C240 128 175 120 152 165 C132 205 160 252 256 312 C256 312 250 262 250 220 C250 178 256 168 256 168 Z" fill="url(#peachCoralBig)"/>

                  <!-- Right Heart Half (with Fork Cutout) -->
                  <path d="M256 168 C272 128 337 120 360 165 C380 205 352 252 256 312 C256 312 262 262 262 220 C262 178 256 168 256 168 Z" fill="url(#softAmberBig)"/>

                  <!-- Negative Space Spoon Cutout (Left) -->
                  <ellipse cx="206" cy="190" rx="20" ry="28" fill="#FFFFFF" transform="rotate(-15 206 190)"/>
                  <path d="M202 216 Q206 250 216 270" stroke="#FFFFFF" stroke-width="8" stroke-linecap="round" fill="none"/>

                  <!-- Negative Space Fork Cutout (Right) -->
                  <path d="M296 172 L296 200 M306 168 L306 200 M316 172 L316 200" stroke="#FFFFFF" stroke-width="5.5" stroke-linecap="round"/>
                  <path d="M292 200 C292 214 320 214 320 200" stroke="#FFFFFF" stroke-width="5.5" stroke-linecap="round" fill="none"/>
                  <path d="M306 210 Q304 246 296 270" stroke="#FFFFFF" stroke-width="8" stroke-linecap="round" fill="none"/>

                  <!-- Center Spark -->
                  <circle cx="256" cy="216" r="14" fill="#FFFFFF"/>
                  <path d="M256 210 C254 206 250 204 247 206 C243 209 243 214 247 218 L256 226 L265 218 C269 214 269 209 265 206 C262 204 258 206 256 210 Z" fill="#E85324"/>
                </g>
              </svg>
            </div>

            <!-- Brand Typography -->
            <div class="flex flex-col text-left drop-shadow-md">
              <span class="font-extrabold text-white tracking-tight text-[23px] leading-tight flex items-center gap-1.5">
                Our<span class="text-[#FFE380]">Mam</span>
                <span class="text-xs bg-black/20 px-1.5 py-0.5 rounded-full text-white font-bold backdrop-blur-sm">🍱</span>
              </span>
              <span class="text-[11px] font-bold tracking-widest text-white/95 uppercase">Food Locket Diary</span>
            </div>
          </div>

          <!-- Bottom anchor spacer -->
          <div class="relative z-10 w-full h-4"></div>
        </div>

        <!-- Bottom White Sheet Container (~62% screen height) -->
        <div class="relative z-20 w-full bg-white rounded-t-[36px] shadow-[0_-16px_40px_rgba(0,0,0,0.12)] px-6 pt-6 pb-7 flex-1 flex flex-col justify-between -mt-6 border-t border-orange-100">
          <div>
            <!-- Sheet Header -->
            <div class="mb-4 text-left">
              <p class="text-stone-600 text-[13px] leading-relaxed mb-4 bg-orange-50/50 p-3 rounded-xl border border-orange-100">
                <strong>OurMam</strong> là mạng xã hội thu nhỏ dành cho bạn bè và cặp đôi. Ứng dụng giúp bạn chụp ảnh món ăn mỗi ngày, ghi chép lượng Kcal và địa điểm để chia sẻ ngay lập tức lên màn hình chính của những người thân yêu nhất.
              </p>
              <h1 id="auth-title" class="text-[23px] font-bold text-stone-900 tracking-tight leading-snug">
                ${this.isSignUp ? 'Tạo Tài Khoản' : 'Đăng nhập'}
              </h1>
              <p id="auth-subtitle" class="text-stone-500 text-xs mt-0.5 font-medium">
                ${this.isSignUp ? 'Tạo tài khoản để bắt đầu chia sẻ bữa ăn' : 'Đăng nhập để chia sẻ từng bữa ăn mỗi ngày'}
              </p>
            </div>

            <!-- Error message container -->
            <div id="auth-error-msg" class="hidden mb-3 p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl font-medium"></div>

            <!-- Auth Form -->
            <form id="auth-form" class="space-y-3">
              
              <!-- Username / Account Input -->
              <div class="relative flex items-center">
                <span class="material-symbols-outlined absolute left-4 text-stone-400 text-[20px] pointer-events-none">person</span>
                <input id="auth-username" required type="text" placeholder="Tài khoản" autocomplete="username" class="w-full pl-11 pr-4 py-3.5 bg-[#F4F5F7] border border-transparent rounded-2xl text-[14px] font-medium text-stone-800 placeholder:text-stone-400 focus:outline-none focus:bg-white focus:border-[#FF6433] focus:ring-2 focus:ring-[#FF6433]/20 transition-all">
              </div>

              <!-- Password Input -->
              <div class="relative flex items-center">
                <span class="material-symbols-outlined absolute left-4 text-stone-400 text-[20px] pointer-events-none">lock</span>
                <input id="auth-password" required type="password" placeholder="Mật khẩu" minlength="8" autocomplete="current-password" class="w-full pl-11 pr-11 py-3.5 bg-[#F4F5F7] border border-transparent rounded-2xl text-[14px] text-stone-800 placeholder:text-stone-400 focus:outline-none focus:bg-white focus:border-[#FF6433] focus:ring-2 focus:ring-[#FF6433]/20 transition-all">
                <button type="button" id="btn-toggle-pwd" class="absolute right-3.5 text-stone-400 hover:text-stone-600 p-1 flex items-center justify-center">
                  <span class="material-symbols-outlined text-[20px]" id="icon-eye">visibility</span>
                </button>
              </div>

              <!-- Real-time Password Strength Meter (Only in Sign Up) -->
              <div id="pwd-strength-container" class="${this.isSignUp ? 'block' : 'hidden'} space-y-1.5 px-1 pt-0.5 pb-1 text-left transition-all">
                <div class="flex items-center justify-between text-[11px]">
                  <span class="font-medium text-stone-500">Độ mạnh mật khẩu:</span>
                  <span id="pwd-strength-label" class="font-bold text-stone-400">Chưa nhập</span>
                </div>
                
                <!-- 4 Segmented Progress Bars -->
                <div class="grid grid-cols-4 gap-1.5 h-1.5 w-full">
                  <div id="bar-1" class="h-full rounded-full bg-stone-200 transition-all duration-300"></div>
                  <div id="bar-2" class="h-full rounded-full bg-stone-200 transition-all duration-300"></div>
                  <div id="bar-3" class="h-full rounded-full bg-stone-200 transition-all duration-300"></div>
                  <div id="bar-4" class="h-full rounded-full bg-stone-200 transition-all duration-300"></div>
                </div>

                <!-- Live Security Checklist Badges -->
                <div class="grid grid-cols-2 gap-x-2 gap-y-1 pt-1 text-[10px] text-stone-500">
                  <div id="req-length" class="flex items-center gap-1 transition-colors">
                    <span class="material-symbols-outlined text-[13px] text-stone-300" id="icon-req-length">radio_button_unchecked</span>
                    <span>Tối thiểu 8 ký tự</span>
                  </div>
                  <div id="req-case" class="flex items-center gap-1 transition-colors">
                    <span class="material-symbols-outlined text-[13px] text-stone-300" id="icon-req-case">radio_button_unchecked</span>
                    <span>Chữ hoa & thường</span>
                  </div>
                  <div id="req-number" class="flex items-center gap-1 transition-colors">
                    <span class="material-symbols-outlined text-[13px] text-stone-300" id="icon-req-number">radio_button_unchecked</span>
                    <span>Có chữ số (0-9)</span>
                  </div>
                  <div id="req-special" class="flex items-center gap-1 transition-colors">
                    <span class="material-symbols-outlined text-[13px] text-stone-300" id="icon-req-special">radio_button_unchecked</span>
                    <span>Ký tự đặc biệt (!@#)</span>
                  </div>
                </div>
              </div>

              <!-- Confirm Password Input (Only in Sign Up) -->
              <div id="confirm-pwd-group" class="${this.isSignUp ? 'block' : 'hidden'} space-y-1 text-left">
                <div class="relative flex items-center">
                  <span class="material-symbols-outlined absolute left-4 text-stone-400 text-[20px] pointer-events-none">lock_reset</span>
                  <input id="auth-confirm-password" type="password" placeholder="Xác nhận lại mật khẩu" minlength="8" autocomplete="new-password" class="w-full pl-11 pr-11 py-3.5 bg-[#F4F5F7] border border-transparent rounded-2xl text-[14px] text-stone-800 placeholder:text-stone-400 focus:outline-none focus:bg-white focus:border-[#FF6433] focus:ring-2 focus:ring-[#FF6433]/20 transition-all">
                  <button type="button" id="btn-toggle-confirm-pwd" class="absolute right-3.5 text-stone-400 hover:text-stone-600 p-1 flex items-center justify-center">
                    <span class="material-symbols-outlined text-[20px]" id="icon-confirm-eye">visibility</span>
                  </button>
                </div>
                <!-- Real-time Password Match Feedback Indicator -->
                <div id="pwd-match-hint" class="hidden items-center gap-1 px-1 text-[11px] font-medium transition-all">
                  <span class="material-symbols-outlined text-[13px]" id="icon-pwd-match">info</span>
                  <span id="text-pwd-match">Mật khẩu xác nhận</span>
                </div>
              </div>

              <!-- Remember & Forgot Password (Only in Sign In) -->
              <div id="signin-extra-row" class="${this.isSignUp ? 'hidden' : 'flex'} items-center justify-between pt-0.5 px-1 text-xs">
                <label class="flex items-center gap-1.5 cursor-pointer select-none text-stone-600">
                  <input type="checkbox" checked class="w-4 h-4 rounded text-[#FF6433] accent-[#FF6433]">
                  <span class="font-medium">Ghi nhớ đăng nhập</span>
                </label>
                <button type="button" id="btn-forgot-pwd" class="text-[#FF6433] font-semibold hover:underline cursor-pointer">
                  Quên mật khẩu?
                </button>
              </div>

              <!-- Main Submit CTA Button -->
              <div class="pt-2">
                <button type="submit" id="btn-auth-submit" class="w-full py-3.5 bg-[#FF6433] hover:bg-[#eb5828] text-white font-bold text-[15px] rounded-2xl shadow-lg shadow-orange-500/30 active:scale-[0.98] transition-all flex items-center justify-center tracking-wide disabled:opacity-60">
                  <span id="btn-auth-text">${this.isSignUp ? 'Đăng ký tài khoản' : 'Đăng nhập'}</span>
                </button>
              </div>
            </form>

            <!-- Divider -->
            <div class="relative flex items-center justify-center my-3.5">
              <div class="w-full border-t border-stone-200/70"></div>
              <span class="absolute bg-white px-3 text-[11px] text-stone-400 font-medium">Hoặc tiếp tục với</span>
            </div>

            <!-- Social Sign In: Google OAuth -->
            <button id="btn-google-auth" type="button" class="w-full py-3 px-4 bg-[#F4F5F7] hover:bg-stone-200/60 rounded-2xl text-stone-700 text-xs font-semibold flex items-center justify-center gap-2.5 active:scale-[0.98] transition-all border border-stone-200/50">
              <svg class="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"></path>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"></path>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"></path>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"></path>
              </svg>
              <span>Tiếp tục với Google</span>
            </button>
          </div>

          <!-- Bottom Switcher -->
          <div class="text-center mt-3">
            <p class="text-xs text-stone-500">
              <span id="auth-switch-prompt">${this.isSignUp ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'}</span>
              <button id="btn-toggle-auth-mode" type="button" class="font-bold text-[#FF6433] hover:underline ml-1">
                ${this.isSignUp ? 'Đăng nhập' : 'Đăng ký ngay'}
              </button>
            </p>
          </div>
        </div>

        <!-- Reset / Forgot Password Modal -->
        <div id="reset-pwd-modal" class="hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div class="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-orange-100 flex flex-col space-y-3.5 animate-scale-up">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-full bg-orange-100 text-primary flex items-center justify-center">
                  <span class="material-symbols-outlined text-base">lock_reset</span>
                </div>
                <h3 class="text-sm font-bold text-stone-900">Khôi Phục Mật Khẩu</h3>
              </div>
              <button id="btn-close-reset-pwd" type="button" class="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 hover:text-stone-700">
                <span class="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
            
            <p class="text-xs text-stone-500">
              Nhập tên tài khoản, email hoặc mã kết nối để đặt mật khẩu mới và lấy lại tài khoản.
            </p>

            <div id="reset-pwd-error" class="hidden p-2.5 bg-red-50 border border-red-200 text-red-600 text-[11px] rounded-xl font-medium"></div>

            <form id="form-reset-pwd" class="space-y-2.5">
              <div>
                <label class="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Tài khoản / Mã người dùng</label>
                <input id="reset-input-user" required type="text" placeholder="VD: bao hoặc MAM922" class="w-full mt-1 px-3 py-2.5 bg-[#F4F5F7] border border-transparent rounded-xl text-xs font-medium text-stone-800 focus:outline-none focus:bg-white focus:border-primary">
              </div>
              <div>
                <label class="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Mật khẩu mới</label>
                <input id="reset-input-new-pwd" required type="password" minlength="8" placeholder="Tối thiểu 8 ký tự (hoa, thường, số, !@#)" class="w-full mt-1 px-3 py-2.5 bg-[#F4F5F7] border border-transparent rounded-xl text-xs font-medium text-stone-800 focus:outline-none focus:bg-white focus:border-primary">
              </div>
              <div>
                <label class="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Xác nhận mật khẩu mới</label>
                <input id="reset-input-confirm-pwd" required type="password" minlength="8" placeholder="Nhập lại mật khẩu mới" class="w-full mt-1 px-3 py-2.5 bg-[#F4F5F7] border border-transparent rounded-xl text-xs font-medium text-stone-800 focus:outline-none focus:bg-white focus:border-primary">
                <p class="text-[10px] text-stone-400 mt-1">Gợi ý: gồm chữ hoa, chữ thường, số và ký tự đặc biệt (VD: Bao123456!@#)</p>
              </div>
              <button id="btn-submit-reset-pwd" type="submit" class="w-full py-2.5 bg-primary hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-sm active:scale-98 transition-all cursor-pointer">
                Xác nhận đổi mật khẩu
              </button>
            </form>
          </div>
        </div>
      </main>
    `;

    this.bindEvents();
  }

  bindEvents() {
    // Password Reveal Toggle
    const btnTogglePwd = document.getElementById('btn-toggle-pwd');
    const pwdInput = document.getElementById('auth-password');
    const iconEye = document.getElementById('icon-eye');
    if (btnTogglePwd && pwdInput) {
      btnTogglePwd.addEventListener('click', () => {
        const isPwd = pwdInput.type === 'password';
        pwdInput.type = isPwd ? 'text' : 'password';
        if (iconEye) iconEye.textContent = isPwd ? 'visibility_off' : 'visibility';
      });
    }

    // Confirm Password Reveal Toggle
    const btnToggleConfirmPwd = document.getElementById('btn-toggle-confirm-pwd');
    const confirmPwdInput = document.getElementById('auth-confirm-password');
    const iconConfirmEye = document.getElementById('icon-confirm-eye');
    if (btnToggleConfirmPwd && confirmPwdInput) {
      btnToggleConfirmPwd.addEventListener('click', () => {
        const isPwd = confirmPwdInput.type === 'password';
        confirmPwdInput.type = isPwd ? 'text' : 'password';
        if (iconConfirmEye) iconConfirmEye.textContent = isPwd ? 'visibility_off' : 'visibility';
      });
    }

    // Toggle Sign In vs Sign Up mode
    const btnToggleMode = document.getElementById('btn-toggle-auth-mode');
    if (btnToggleMode) {
      btnToggleMode.addEventListener('click', () => {
        this.isSignUp = !this.isSignUp;
        this.render();
      });
    }

    // Real-time Password Strength Check
    if (pwdInput) {
      pwdInput.addEventListener('input', () => {
        if (this.isSignUp) {
          this.updatePasswordStrength(pwdInput.value);
          this.checkPasswordMatch();
        }
      });
    }

    if (confirmPwdInput) {
      confirmPwdInput.addEventListener('input', () => {
        if (this.isSignUp) {
          this.checkPasswordMatch();
        }
      });
    }

    // Submit Form (Real Supabase Auth)
    const authForm = document.getElementById('auth-form');
    if (authForm) {
      authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('auth-username').value.trim();
        const password = pwdInput.value;
        const confirmPassword = confirmPwdInput ? confirmPwdInput.value : '';

        const errorEl = document.getElementById('auth-error-msg');
        const btnSubmit = document.getElementById('btn-auth-submit');
        const btnText = document.getElementById('btn-auth-text');

        if (errorEl) errorEl.classList.add('hidden');

        // Validation for Sign Up
        if (this.isSignUp) {
          if (password.length < 8) {
            if (errorEl) {
              errorEl.textContent = "Mật khẩu phải có tối thiểu 8 ký tự theo chuẩn bảo mật!";
              errorEl.classList.remove('hidden');
            }
            return;
          }

          if (password !== confirmPassword) {
            if (errorEl) {
              errorEl.textContent = "Mật khẩu xác nhận không khớp. Vui lòng nhập lại!";
              errorEl.classList.remove('hidden');
            }
            return;
          }
        }

        if (btnSubmit) btnSubmit.disabled = true;
        if (btnText) btnText.textContent = "Đang xử lý...";

        try {
          if (this.isSignUp) {
            // Sign Up
            const { data, error } = await api.signUp(username, password, username);
            if (error) throw error;

            soundHelper.playPop();
            
            if (errorEl) {
              errorEl.className = 'mb-3 p-3 bg-emerald-50 border border-emerald-200 text-emerald-600 text-xs rounded-xl font-medium flex items-center justify-between';
              errorEl.innerHTML = `<span>Đăng ký thành công! Hãy đăng nhập ngay.</span><button type="button" class="text-emerald-700 font-bold hover:underline" onclick="document.getElementById('btn-toggle-auth-mode').click()">Đăng nhập</button>`;
              errorEl.classList.remove('hidden');
            }
            this.isSignUp = false;
            if (btnSubmit) btnSubmit.disabled = false;
            if (btnText) btnText.textContent = 'Đăng nhập';
            return;
          } else {
            // Sign In
            const { data, error } = await api.signIn(username, password);
            if (error) throw error;

            soundHelper.playPop();
            const user = data?.user || { id: "user-" + Date.now() };
            this.onAuthSuccess(user, username);
          }
        } catch (err) {
          console.error("Auth error:", err);
          if (errorEl) {
            let msg = err.message || "Thao tác thất bại. Vui lòng thử lại!";
            if (err.isGoogleUser) {
              msg = `Tài khoản ${err.profileName || ''} được đăng ký qua Google. Vui lòng bấm nút "Tiếp tục với Google" bên dưới để đăng nhập!`;
            } else if (msg.toLowerCase().includes("user already registered")) {
              msg = "Tài khoản này đã tồn tại. Bạn hãy chuyển sang Đăng nhập nhé!";
            } else if (msg.toLowerCase().includes("invalid login credentials")) {
              msg = "Tài khoản hoặc mật khẩu không chính xác! Bạn có thể bấm 'Quên mật khẩu?' để đặt lại mật khẩu mới.";
            } else if (msg.toLowerCase().includes("email not confirmed")) {
              msg = "Vui lòng tắt 'Confirm email' trong Supabase Authentication để đăng nhập ngay!";
            }
            errorEl.className = 'mb-3 p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl font-medium';
            errorEl.textContent = msg;
            errorEl.classList.remove('hidden');
          }
        } finally {
          if (btnSubmit) btnSubmit.disabled = false;
          if (btnText) btnText.textContent = this.isSignUp ? 'Đăng ký tài khoản' : 'Đăng nhập';
        }
      });
    }

    // Google Sign In
    const btnGoogle = document.getElementById('btn-google-auth');
    if (btnGoogle) {
      btnGoogle.addEventListener('click', async () => {
        soundHelper.playPop();
        const origContent = btnGoogle.innerHTML;
        btnGoogle.innerHTML = '<span class="material-symbols-outlined animate-spin text-[#FF6433]">progress_activity</span><span>Đang chuyển hướng...</span>';
        btnGoogle.disabled = true;
        try {
          const { error } = await api.signInWithGoogle();
          if (error) throw error;
        } catch (err) {
          console.error('Google Auth Error:', err);
          const errorEl = document.getElementById('auth-error-msg');
          if (errorEl) {
            errorEl.textContent = err.message || "Không thể kết nối Google Auth. Vui lòng thử lại!";
            errorEl.classList.remove('hidden');
          }
          btnGoogle.innerHTML = origContent;
          btnGoogle.disabled = false;
        }
      });
    }

    // Forgot / Reset Password Modal Handlers
    const btnForgot = document.getElementById('btn-forgot-pwd');
    const modalReset = document.getElementById('reset-pwd-modal');
    const btnCloseReset = document.getElementById('btn-close-reset-pwd');
    const formReset = document.getElementById('form-reset-pwd');
    const resetUser = document.getElementById('reset-input-user');
    const resetNewPwd = document.getElementById('reset-input-new-pwd');
    const resetConfirmPwd = document.getElementById('reset-input-confirm-pwd');
    const resetError = document.getElementById('reset-pwd-error');
    const btnSubmitReset = document.getElementById('btn-submit-reset-pwd');

    const openResetModal = (e) => {
      if (e) e.preventDefault();
      const curUser = document.getElementById('auth-username')?.value.trim() || '';
      if (resetUser) resetUser.value = curUser;
      if (resetNewPwd) resetNewPwd.value = '';
      if (resetConfirmPwd) resetConfirmPwd.value = '';
      if (resetError) resetError.classList.add('hidden');
      if (modalReset) modalReset.classList.remove('hidden');
    };

    if (btnForgot) btnForgot.addEventListener('click', openResetModal);

    if (btnCloseReset && modalReset) {
      btnCloseReset.addEventListener('click', () => {
        modalReset.classList.add('hidden');
      });
    }

    if (formReset) {
      formReset.addEventListener('submit', async (e) => {
        e.preventDefault();
        const account = resetUser.value.trim();
        const newPwd = resetNewPwd.value;
        const confirmPwd = resetConfirmPwd ? resetConfirmPwd.value : newPwd;

        if (!account || !newPwd) return;

        if (newPwd.length < 8) {
          resetError.textContent = "Mật khẩu mới phải có tối thiểu 8 ký tự!";
          resetError.classList.remove('hidden');
          return;
        }

        if (newPwd !== confirmPwd) {
          resetError.textContent = "Mật khẩu xác nhận không khớp. Vui lòng kiểm tra lại!";
          resetError.classList.remove('hidden');
          return;
        }

        btnSubmitReset.disabled = true;
        btnSubmitReset.textContent = "Đang cập nhật...";
        resetError.classList.add('hidden');

        try {
          await api.adminResetPassword(account, newPwd);
          soundHelper.playPop();
          modalReset.classList.add('hidden');

          // Auto-fill login form
          const authUser = document.getElementById('auth-username');
          const authPwd = document.getElementById('auth-password');
          if (authUser) authUser.value = account;
          if (authPwd) authPwd.value = newPwd;

          const errorEl = document.getElementById('auth-error-msg');
          if (errorEl) {
            errorEl.className = 'mb-3 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl font-medium';
            errorEl.textContent = `Đã đổi mật khẩu thành công cho "${account}"! Bạn có thể bấm nút "Đăng nhập" ngay bên dưới.`;
            errorEl.classList.remove('hidden');
          }
        } catch (err) {
          console.error("Reset pwd err:", err);
          resetError.textContent = err.message || "Không thể đặt lại mật khẩu. Vui lòng thử lại!";
          resetError.classList.remove('hidden');
        } finally {
          btnSubmitReset.disabled = false;
          btnSubmitReset.textContent = "Xác nhận đổi mật khẩu";
        }
      });
    }
  }

  updatePasswordStrength(password) {
    const labelEl = document.getElementById('pwd-strength-label');
    const bar1 = document.getElementById('bar-1');
    const bar2 = document.getElementById('bar-2');
    const bar3 = document.getElementById('bar-3');
    const bar4 = document.getElementById('bar-4');

    const reqLength = document.getElementById('req-length');
    const reqCase = document.getElementById('req-case');
    const reqNumber = document.getElementById('req-number');
    const reqSpecial = document.getElementById('req-special');

    const iconLength = document.getElementById('icon-req-length');
    const iconCase = document.getElementById('icon-req-case');
    const iconNumber = document.getElementById('icon-req-number');
    const iconSpecial = document.getElementById('icon-req-special');

    if (!labelEl || !bar1 || !bar2 || !bar3 || !bar4) return;

    if (!password) {
      labelEl.textContent = 'Chưa nhập';
      labelEl.className = 'font-bold text-stone-400';
      [bar1, bar2, bar3, bar4].forEach(b => b.className = 'h-full rounded-full bg-stone-200 transition-all duration-300');
      this.setCheckItem(reqLength, iconLength, false);
      this.setCheckItem(reqCase, iconCase, false);
      this.setCheckItem(reqNumber, iconNumber, false);
      this.setCheckItem(reqSpecial, iconSpecial, false);
      return;
    }

    const hasLength = password.length >= 8;
    const hasCase = /[a-z]/.test(password) && /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^a-zA-Z0-9]/.test(password);

    this.setCheckItem(reqLength, iconLength, hasLength);
    this.setCheckItem(reqCase, iconCase, hasCase);
    this.setCheckItem(reqNumber, iconNumber, hasNumber);
    this.setCheckItem(reqSpecial, iconSpecial, hasSpecial);

    let score = 0;
    if (hasLength) score++;
    if (hasCase) score++;
    if (hasNumber) score++;
    if (hasSpecial) score++;

    // Extra point for 10+ length
    if (password.length >= 10 && score < 4) score++;

    if (score === 1) {
      labelEl.textContent = 'Yếu ⚠️';
      labelEl.className = 'font-bold text-rose-500';
      bar1.className = 'h-full rounded-full bg-rose-500 transition-all duration-300';
      bar2.className = bar3.className = bar4.className = 'h-full rounded-full bg-stone-200 transition-all duration-300';
    } else if (score === 2) {
      labelEl.textContent = 'Trung bình ⚡';
      labelEl.className = 'font-bold text-amber-500';
      bar1.className = bar2.className = 'h-full rounded-full bg-amber-500 transition-all duration-300';
      bar3.className = bar4.className = 'h-full rounded-full bg-stone-200 transition-all duration-300';
    } else if (score === 3) {
      labelEl.textContent = 'Khá tốt 🛡️';
      labelEl.className = 'font-bold text-blue-500';
      bar1.className = bar2.className = bar3.className = 'h-full rounded-full bg-blue-500 transition-all duration-300';
      bar4.className = 'h-full rounded-full bg-stone-200 transition-all duration-300';
    } else if (score >= 4) {
      labelEl.textContent = 'Rất mạnh 🔒✨';
      labelEl.className = 'font-bold text-emerald-500';
      bar1.className = bar2.className = bar3.className = bar4.className = 'h-full rounded-full bg-emerald-500 transition-all duration-300';
    }
  }

  setCheckItem(containerEl, iconEl, isMet) {
    if (!containerEl || !iconEl) return;
    if (isMet) {
      containerEl.classList.remove('text-stone-500');
      containerEl.classList.add('text-emerald-600', 'font-semibold');
      iconEl.textContent = 'check_circle';
      iconEl.className = 'material-symbols-outlined text-[13px] text-emerald-500 filled';
    } else {
      containerEl.classList.remove('text-emerald-600', 'font-semibold');
      containerEl.classList.add('text-stone-500');
      iconEl.textContent = 'radio_button_unchecked';
      iconEl.className = 'material-symbols-outlined text-[13px] text-stone-300';
    }
  }

  checkPasswordMatch() {
    const pwdInput = document.getElementById('auth-password');
    const confirmPwdInput = document.getElementById('auth-confirm-password');
    const matchHint = document.getElementById('pwd-match-hint');
    const iconMatch = document.getElementById('icon-pwd-match');
    const textMatch = document.getElementById('text-pwd-match');

    if (!pwdInput || !confirmPwdInput || !matchHint || !iconMatch || !textMatch) return;

    const pwd = pwdInput.value;
    const confirm = confirmPwdInput.value;

    if (!confirm) {
      matchHint.classList.add('hidden');
      matchHint.classList.remove('flex');
      return;
    }

    matchHint.classList.remove('hidden');
    matchHint.classList.add('flex');

    if (pwd === confirm) {
      matchHint.className = 'flex items-center gap-1 px-1 text-[11px] font-semibold text-emerald-600 transition-all';
      iconMatch.textContent = 'check_circle';
      iconMatch.className = 'material-symbols-outlined text-[13px] text-emerald-500 filled';
      textMatch.textContent = 'Mật khẩu khớp hoàn hảo ✨';
    } else {
      matchHint.className = 'flex items-center gap-1 px-1 text-[11px] font-medium text-rose-500 transition-all';
      iconMatch.textContent = 'cancel';
      iconMatch.className = 'material-symbols-outlined text-[13px] text-rose-500';
      textMatch.textContent = 'Mật khẩu xác nhận chưa khớp';
    }
  }

  show() {
    if (this.container) this.container.classList.remove('hidden');
    if (this.appContainer) this.appContainer.classList.add('hidden');
  }

  hide() {
    if (this.container) this.container.classList.add('hidden');
    if (this.appContainer) this.appContainer.classList.remove('hidden');
  }
}

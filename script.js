// --- AYARLAR ---
        const SUPABASE_URL = 'https://osaczjczqmgcelhopdnj.supabase.co';
        const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zYWN6amN6cW1nY2VsaG9wZG5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczODA4MjUsImV4cCI6MjA4Mjk1NjgyNX0.iYWIlwCMgh4ielBQ-uTFIe_0JRYXHONWfr-mkNoT0c0';
        const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        
        let currentUser = null;
        let activeLessonId = null;
        let isStoryMode = false;
        let currentProfile = {}; 
        let targetLessonId = null;
        let calcModalInstance = null;
        let kanitModalInstance = null;
        // --- AUTH ---
        function toggleAuth(type) {
            document.getElementById('login-form').classList.toggle('hidden', type === 'register');
            document.getElementById('register-form').classList.toggle('hidden', type !== 'register');
        }

        async function kayitOl() {
            const email = document.getElementById('r-email').value;
            const password = document.getElementById('r-pass').value;
            const data = {
                full_name: document.getElementById('r-fullname').value,
                username: document.getElementById('r-username').value,
                vize_oran: document.getElementById('r-vize').value || 40,
                gecme_notu: document.getElementById('r-gecme').value || 50,
                final_baraj: document.getElementById('r-final').value || 50
            };
            
            if(!email || !password || !data.username) return alert("Eksik bilgi!");

            const redirectLink = 'https://melikecoba.github.io/devamsizlik-takip/succsess.html'; 

            const { error } = await sb.auth.signUp({ 
                email, 
                password, 
                options: { 
                    data,
                    emailRedirectTo: redirectLink 
                } 
            });

            if(error) alert("Hata: " + error.message);
            else alert("Kayıt başarılı! Lütfen mail kutunu kontrol et.");
        }

        async function girisYap() {
            const { error } = await sb.auth.signInWithPassword({
                email: document.getElementById('l-email').value,
                password: document.getElementById('l-pass').value
            });
            if(error) alert(error.message);
            else window.location.reload();
        }
        async function cikisYap() { await sb.auth.signOut(); window.location.reload(); }

        // --- BAŞLANGIÇ ---
        window.onload = async () => {
            const { data: { session } } = await sb.auth.getSession();
            if(session) {
                currentUser = session.user;
                document.getElementById('auth-screen').classList.add('hidden');
                document.getElementById('app-screen').classList.remove('hidden');
                await profilGetir();
                dersleriGetir();
                arkadaslariGetir();
                bildirimSayisiGetir();
            }
        };

        // --- PROFİL ---
        async function profilGetir() {
            const { data } = await sb.from('profiles').select('*').eq('id', currentUser.id).single();
            if(data) {
                currentProfile = data;
                document.getElementById('header-name').innerText = data.full_name || data.username;
                document.getElementById('header-avatar').src = data.avatar_url || 'https://via.placeholder.com/150';
                
                document.getElementById('edit-fullname').value = data.full_name;
                document.getElementById('edit-username').value = data.username;
                document.getElementById('modal-avatar-preview').src = data.avatar_url;
                
                document.getElementById('edit-vize').value = data.vize_oran || 40;
                document.getElementById('edit-gecme').value = data.gecme_notu || 50;
                document.getElementById('edit-final').value = data.final_baraj || 50;
            }
        }
        function profilModalAc() { new bootstrap.Modal(document.getElementById('profileModal')).show(); }

        async function profilGuncelle() {
            const btn = document.querySelector('#profileModal button.btn-primary');
            btn.innerText = "Hesaplanıyor..."; 
            btn.disabled = true;

            const yeniVizeOran = parseInt(document.getElementById('edit-vize').value) || 40;
            const yeniGecme = parseInt(document.getElementById('edit-gecme').value) || 50;
            const yeniBaraj = parseInt(document.getElementById('edit-final').value) || 50;
            
            const updates = {
                full_name: document.getElementById('edit-fullname').value,
                username: document.getElementById('edit-username').value,
                vize_oran: yeniVizeOran,
                gecme_notu: yeniGecme,
                final_baraj: yeniBaraj
            };

            const file = document.getElementById('avatar-input').files[0];
            if(file) {
                const fileName = `avatar_${currentUser.id}_${Date.now()}`;
                await sb.storage.from('avatars').upload(fileName, file);
                const { data } = sb.storage.from('avatars').getPublicUrl(fileName);
                updates.avatar_url = data.publicUrl;
            }

            await sb.from('profiles').update(updates).eq('id', currentUser.id);

            const { data: lessons } = await sb.from('lessons').select('*').eq('user_id', currentUser.id).not('vize_score', 'is', null);
            if(lessons && lessons.length > 0) {
                for (const lesson of lessons) {
                    const vizePuan = lesson.vize_score;
                    const vizeEtkisi = vizePuan * (yeniVizeOran / 100);
                    const gerekenToplam = yeniGecme - vizeEtkisi;
                    const finalOran = (100 - yeniVizeOran) / 100;
                    let gerekenFinal = gerekenToplam / finalOran;
                    if(gerekenFinal < yeniBaraj) gerekenFinal = yeniBaraj;
                    await sb.from('lessons').update({ target_grade: Math.ceil(gerekenFinal) }).eq('id', lesson.id);
                }
            }
            alert("Profil güncellendi ve notlar yeniden hesaplandı! 🎉");
            window.location.reload();
        }

        // --- DERSLER ---
        async function dersleriGetir() {
            const { data: lessons } = await sb.from('lessons').select('*').eq('user_id', currentUser.id).order('created_at');
            const { data: logs } = await sb.from('logs').select('*').eq('user_id', currentUser.id).eq('is_absence', true);
            const div = document.getElementById('lesson-list');
            div.innerHTML = "";

            if(lessons) {
                lessons.forEach(l => {
                    const count = logs.filter(x => x.lesson_id === l.id).length;
                    
                    // DÜZELTME 1: 'const' yerine 'let' yaptık ki aşağıda değiştirebilelim
                    let rem = l.max_limit - count;
                    
                    const color = rem <= 1 ? 'bg-danger' : (rem <= 2 ? 'bg-warning' : 'bg-success');
                    
                    // DÜZELTME 2: 20'den büyükse rem değişkenini "∞" sembolüne çevir
                    if (l.max_limit >= 20) {
                        rem = "∞";
                    }

                    let sonucHtml = "";
                    if (l.target_grade !== null) {
                        const val = l.target_grade;
                        if (val > 100) sonucHtml = `<div class="mt-2 text-center small fw-bold border-top pt-2 text-danger"><i class="fa-solid fa-circle-xmark"></i> ${val} alman lazım, kaldın.</div>`;
                        else if (val < 0) sonucHtml = `<div class="mt-2 text-center small fw-bold border-top pt-2 text-success"><i class="fa-solid fa-check-circle"></i> Zaten geçiyorsun!</div>`;
                        else sonucHtml = `<div class="mt-2 text-center small fw-bold border-top pt-2 text-primary">Finalden EN AZ <span class="fs-6">${val}</span> alman gerek.</div>`;
                    }

                    div.innerHTML += `
                    <div class="col-md-6">
                        <div class="card p-3 h-100 position-relative">
                            <span class="badge ${color} position-absolute top-0 end-0 m-2">${rem} Hak</span>
                            <h5 class="fw-bold">${l.name}</h5>
                            <div class="progress my-2" style="height:6px;"><div class="progress-bar ${color}" style="width: ${(count/l.max_limit)*100}%"></div></div>
                            <div class="d-flex gap-1 mt-auto">
                                <button onclick="islemBaslat(${l.id}, true)" class="btn btn-sm btn-outline-danger w-100">🚫 Firar</button>
                                <button onclick="islemBaslat(${l.id}, false)" class="btn btn-sm btn-outline-info w-100">Dersten Hikaye Ekle</button>
                            </div>
                            <div class="d-flex gap-1 mt-2">
                                <button onclick="notHesapla(${l.id})" class="btn btn-sm btn-dark w-100">Final Notu Hesapla</button>
                                <button onclick="gecmisiGor(${l.id})" class="btn btn-sm btn-light border w-100">Devamsızlık Geçmişi</button>
                                <button onclick="dersSil(${l.id})" class="btn btn-sm text-danger"><i class="fa-solid fa-trash"></i></button>
                            </div>
                            ${sonucHtml}
                        </div>
                    </div>`;
                });
            }
        }

        // --- NOT HESAPLAMA ---
        function notHesapla(lessonId) {
            targetLessonId = lessonId;
            document.getElementById('modal-vize-input').value = "";
            const v = currentProfile.vize_oran || 40;
            const g = currentProfile.gecme_notu || 50;
            const f = currentProfile.final_baraj || 50;
            document.getElementById('calc-info-display').innerHTML = `(Sistem: Vize %${v}, Geçme ${g}, Final Barajı ${f})`;
            const modalEl = document.getElementById('calcModal');
            calcModalInstance = new bootstrap.Modal(modalEl);
            calcModalInstance.show();
        }

        function ayarlaraGit() {
            if(calcModalInstance) calcModalInstance.hide();
            profilModalAc();
        }

        async function gercekHesapla() {
            const vizeDegeri = document.getElementById('modal-vize-input').value;
            if (vizeDegeri === "" || vizeDegeri === null) return alert("Lütfen bir not girin!");
            if(calcModalInstance) calcModalInstance.hide();

            const vOran = currentProfile.vize_oran || 40;
            const gNotu = currentProfile.gecme_notu || 50;
            const fBaraj = currentProfile.final_baraj || 50;

            const vizePuan = parseFloat(vizeDegeri);
            const vizeEtkisi = vizePuan * (vOran / 100);
            const gerekenToplam = gNotu - vizeEtkisi;
            const finalOran = (100 - vOran) / 100;
            let gerekenFinal = gerekenToplam / finalOran;
            if(gerekenFinal < fBaraj) gerekenFinal = fBaraj;
            const sonuc = Math.ceil(gerekenFinal);

            const { error } = await sb.from('lessons').update({ target_grade: sonuc, vize_score: vizePuan }).eq('id', targetLessonId);
            if(error) alert("Hata: " + error.message); else dersleriGetir(); 
        }

        // --- KANIT MODALI ---
        function islemBaslat(lId, abs) { 
            activeLessonId = lId; isStoryMode = !abs; 
            if(isStoryMode) document.getElementById('photo-input').click(); 
            else { const modalEl = document.getElementById('kanitModal'); kanitModalInstance = new bootstrap.Modal(modalEl); kanitModalInstance.show(); }
        }
        function kanitCevap(cevap) {
            if(kanitModalInstance) kanitModalInstance.hide();
            if(cevap === 'evet') document.getElementById('photo-input').click(); else kayitEkle(null);
        }

        // --- TAKİP ---
        async function arkadaslariGetir() {
            const { data: friends } = await sb.from('friendships').select('friend_id, profiles!friendships_friend_id_fkey(*)').eq('user_id', currentUser.id);
            const div = document.getElementById('friends-list');
            div.innerHTML = "";
            if(!friends || friends.length===0) { div.innerHTML = "<span class='text-muted'>Kimseyi takip etmiyorsun.</span>"; return; }
            friends.forEach(f => {
                div.innerHTML += `
                <div class="d-flex align-items-center justify-content-between mb-2">
                    <div class="d-flex align-items-center"><img src="${f.profiles.avatar_url}" class="avatar me-2" style="width:30px;height:30px;"><span>${f.profiles.username}</span></div>
                    <button onclick="takibiBirak('${f.friend_id}')" class="btn btn-sm text-danger border-0"><i class="fa-solid fa-xmark"></i></button>
                </div>`;
            });
        }
        async function takibiBirak(friendId) {
            if(confirm("Takipten çıkarmak istiyor musun?")) {
                await sb.from('friendships').delete().eq('user_id', currentUser.id).eq('friend_id', friendId);
                arkadaslariGetir(); akisGetir();
            }
        }

        // --- DİĞER FONKSİYONLAR ---
        async function dersEkle() { const name = document.getElementById('new-lesson-name').value; const limit = document.getElementById('new-lesson-limit').value; if(name) { await sb.from('lessons').insert({user_id: currentUser.id, name, max_limit: limit}); document.getElementById('new-lesson-name').value=""; dersleriGetir(); } }
        async function dersSil(id) { if(confirm("Silinsin mi?")) { await sb.from('lessons').delete().eq('id', id); dersleriGetir(); } }
        function tabDegis(tab) {
            document.getElementById('view-lessons').classList.toggle('hidden', tab!=='lessons');
            document.getElementById('view-social').classList.toggle('hidden', tab!=='social');
            document.getElementById('tab-lessons').classList.toggle('active', tab==='lessons');
            document.getElementById('tab-social').classList.toggle('active', tab==='social');
            if(tab==='social') akisGetir();
        }
        document.getElementById('avatar-input').onchange = (e) => { if(e.target.files[0]) document.getElementById('modal-avatar-preview').src = URL.createObjectURL(e.target.files[0]); };
        document.getElementById('photo-input').onchange = async (e) => { if(e.target.files[0]) { const n=`log_${Date.now()}`; await sb.storage.from('kanitlar').upload(n,e.target.files[0]); const {data}=sb.storage.from('kanitlar').getPublicUrl(n); kayitEkle(data.publicUrl); } };
        async function kayitEkle(url) { await sb.from('logs').insert({user_id:currentUser.id, lesson_id:activeLessonId, memory_photo_url:url, is_absence:!isStoryMode}); alert("Kaydedildi."); dersleriGetir(); }
        async function gecmisiGor(lId) { new bootstrap.Modal(document.getElementById('historyModal')).show(); const {data:logs}=await sb.from('logs').select('*').eq('lesson_id',lId).order('created_at',{ascending:false}); let h="<ul class='list-group'>"; logs.forEach(l=>{h+=`<li class='list-group-item d-flex justify-content-between'>${new Date(l.created_at).toLocaleDateString()} ${l.is_absence?'Yok':'Story'} <button onclick='logSil(${l.id})' class='btn btn-sm btn-danger'>Sil</button></li>`}); document.getElementById('history-content').innerHTML=h+"</ul>"; }
        async function logSil(id) { await sb.from('logs').delete().eq('id',id); alert('Silindi'); window.location.reload(); }
        async function arkadasAra() {
            const query = document.getElementById('search-username').value;
            const { data: users } = await sb.from('profiles').select('*').ilike('username', `%${query}%`);
            const div = document.getElementById('search-results'); div.innerHTML = "";
            const { data: myFriends } = await sb.from('friendships').select('friend_id').eq('user_id', currentUser.id);
            const followedIds = myFriends.map(f => f.friend_id);
            users.forEach(u => { if(u.id !== currentUser.id) { const isFollowing = followedIds.includes(u.id); const btn = isFollowing ? `<button class="btn btn-sm btn-secondary" disabled>Takip Ediliyor</button>` : `<button onclick="arkadasEkle('${u.id}', this)" class="btn btn-sm btn-primary">Takip Et</button>`; div.innerHTML += `<div class="list-group-item d-flex justify-content-between align-items-center"><div><img src="${u.avatar_url}" class="avatar me-2">${u.username}</div>${btn}</div>`; } });
        }
        async function arkadasEkle(friendId, btn) {
            const { error } = await sb.from('friendships').insert({ user_id: currentUser.id, friend_id: friendId });
            if(error) { if(error.code === '23505') { btn.innerText = "Takip Ediliyor"; btn.disabled = true; } else alert(error.message); } else { btn.innerText = "Takip Ediliyor"; btn.disabled = true; bildirimGonder(friendId, "seni takip etmeye başladı."); arkadaslariGetir(); }
        }
        async function akisGetir() {
            const feedDiv = document.getElementById('social-feed'); feedDiv.innerHTML = "Yükleniyor...";
            const { data: fr } = await sb.from('friendships').select('friend_id').eq('user_id', currentUser.id);
            const ids = fr ? fr.map(f=>f.friend_id) : []; ids.push(currentUser.id);
            const { data: logs } = await sb.from('logs').select('*, profiles(username, avatar_url, id), lessons(name), likes(user_id), comments(content, profiles(username))').in('user_id', ids).order('created_at', {ascending:false}).limit(20);
            feedDiv.innerHTML = "";
            logs.forEach(l => { if(!l.profiles) return; const liked = l.likes.some(x=>x.user_id===currentUser.id); feedDiv.innerHTML += `<div class="card p-3 mb-3 ${l.is_absence?'':'story-mode'}"><div class="d-flex align-items-center mb-2"><img src="${l.profiles.avatar_url}" class="avatar me-2"><b>${l.profiles.username}</b><span class="badge ms-2 ${l.is_absence?'bg-danger':'bg-info text-dark'}">${l.lessons.name}</span></div>${l.memory_photo_url ? `<img src="${l.memory_photo_url}" class="feed-img mb-2">` : ''}<div class="d-flex gap-2"><button onclick="begen(${l.id}, '${l.user_id}')" class="btn btn-sm ${liked?'btn-danger':'btn-outline-danger'}"><i class="fa-solid fa-heart"></i> ${l.likes.length}</button><div class="input-group input-group-sm"><input type="text" id="input-comment-${l.id}" class="form-control" placeholder="Yorum..."><button onclick="yorumGonder(${l.id}, '${l.user_id}')" class="btn btn-outline-secondary"><i class="fa-solid fa-paper-plane"></i></button></div></div><div class="mt-2 small bg-light p-2 rounded ${l.comments.length===0?'hidden':''}">${l.comments.map(c=>`<div><b>${c.profiles.username}:</b> ${c.content}</div>`).join('')}</div></div>`; });
        }
        async function begen(lId, ownerId) { const {data:likes}=await sb.from('likes').select('*').eq('log_id',lId).eq('user_id',currentUser.id); if(likes.length>0) await sb.from('likes').delete().eq('id',likes[0].id); else { await sb.from('likes').insert({log_id:lId, user_id:currentUser.id}); bildirimGonder(ownerId, "gönderini beğendi ❤️"); } akisGetir(); }
        async function yorumGonder(lId, ownerId) { const c=document.getElementById(`input-comment-${lId}`).value; if(!c)return; await sb.from('comments').insert({log_id:lId, user_id:currentUser.id, content:c}); bildirimGonder(ownerId, "yorum yaptı 💬"); akisGetir(); }
        async function bildirimGonder(targetId, msg) { if(targetId !== currentUser.id) await sb.from('notifications').insert({ user_id: targetId, actor_id: currentUser.id, message: msg }); }
        async function bildirimSayisiGetir() { const { count } = await sb.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', currentUser.id); if(count > 0) { const b = document.getElementById('notif-count'); b.innerText = count; b.classList.remove('hidden'); } }
        async function bildirimleriAc() { const m = new bootstrap.Modal(document.getElementById('notifModal')); m.show(); document.getElementById('notif-count').classList.add('hidden'); const { data: notifs } = await sb.from('notifications').select('*, sender:profiles!notifications_actor_id_fkey(username, avatar_url)').eq('user_id', currentUser.id).order('created_at', {ascending: false}); const div = document.getElementById('notif-content'); div.innerHTML = ""; if(!notifs || notifs.length===0) div.innerHTML = "Bildirim yok."; else notifs.forEach(n => { const u = n.sender || {username:'?', avatar_url:''}; div.innerHTML += `<div class="d-flex align-items-center mb-2 border-bottom pb-2"><img src="${u.avatar_url}" class="avatar me-2"><div><strong>${u.username}</strong> ${n.message}</div></div>`; }); }
        async function bildirimleriTemizle() { await sb.from('notifications').delete().eq('user_id', currentUser.id); document.getElementById('notif-content').innerHTML = "Temizlendi."; }

    
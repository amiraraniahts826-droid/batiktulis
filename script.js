/* Seluruh konten ditulis di index.html. File ini mengatur interaksi saja. */

/* ===== Filter kategori + jumlah koleksi + animasi muncul ===== */
const filterBar = document.getElementById("filter");
filterBar.addEventListener("click", e => {
    const tombol = e.target.closest(".filter-btn");
    if (!tombol) return;
    filterBar.querySelectorAll(".filter-btn").forEach(b => {
        b.classList.remove("aktif");
        b.setAttribute("aria-pressed", "false");
    });
    tombol.classList.add("aktif");
    tombol.setAttribute("aria-pressed", "true");

    const pilihan = tombol.dataset.filter;
    let urutan = 0;
    document.querySelectorAll(".kartu-item").forEach(item => {
        const cocok = pilihan === "Semua" || item.dataset.kategori === pilihan;
        item.classList.toggle("sembunyi", !cocok);
        item.classList.remove("muncul");
        if (cocok) {
            item.classList.add("tampil");                  // pastikan terlihat
            void item.offsetWidth;                         // mulai ulang animasi
            item.style.animationDelay = (urutan++ * 0.08) + "s";
            item.classList.add("muncul");
        }
    });
    document.getElementById("jumlah").textContent = urutan;
});

/* ===== Animasi muncul saat scroll ===== */
const pengamat = new IntersectionObserver(entries => {
    entries.forEach(en => {
        if (en.isIntersecting) { en.target.classList.add("tampil"); pengamat.unobserve(en.target); }
    });
}, { threshold: 0.12 });
document.querySelectorAll(".reveal").forEach(el => pengamat.observe(el));

/* ===== Menu aktif sesuai section yang sedang dilihat ===== */
const linkMenu = document.querySelectorAll(".navbar .nav-link");
const spy = new IntersectionObserver(entries => {
    entries.forEach(en => {
        if (!en.isIntersecting) return;
        linkMenu.forEach(l => l.classList.toggle("active", l.getAttribute("href") === "#" + en.target.id));
    });
}, { rootMargin: "-45% 0px -50% 0px" });
document.querySelectorAll("main section[id]").forEach(s => spy.observe(s));

/* ===== Navbar mengecil, progres scroll, tombol ke atas ===== */
const navbar = document.getElementById("navbar");
const progres = document.getElementById("progress");
const tombolAtas = document.getElementById("atas");
function saatScroll() {
    const y = window.scrollY;
    const tinggi = document.documentElement.scrollHeight - window.innerHeight;
    navbar.classList.toggle("kecil", y > 40);
    progres.style.width = (tinggi > 0 ? (y / tinggi) * 100 : 0) + "%";
    tombolAtas.classList.toggle("tampil", y > 600);
}
window.addEventListener("scroll", saatScroll, { passive: true });
saatScroll();
tombolAtas.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

/* ===== Tutup menu mobile setelah klik, dan isi tahun otomatis ===== */
linkMenu.forEach(link => {
    link.addEventListener("click", () => {
        const menu = document.getElementById("menu");
        if (menu.classList.contains("show")) bootstrap.Collapse.getInstance(menu).hide();
    });
});
document.getElementById("tahun").textContent = new Date().getFullYear();

const kurangiGerak = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ===== Angka rentang harga menghitung naik saat terlihat ===== */
const hargaBox = document.querySelector(".harga");
if (hargaBox && !kurangiGerak) {
    const hitung = new IntersectionObserver(entries => {
        if (!entries[0].isIntersecting) return;
        hitung.disconnect();
        hargaBox.querySelectorAll("[data-target]").forEach(el => {
            const target = Number(el.dataset.target), mulai = performance.now(), durasi = 1600;
            (function langkah(now) {
                const t = Math.min((now - mulai) / durasi, 1);
                const nilai = Math.round(target * (1 - Math.pow(1 - t, 3)));
                el.textContent = "Rp" + nilai.toLocaleString("id-ID");
                if (t < 1) requestAnimationFrame(langkah);
            })(mulai);
        });
    }, { threshold: 0.6 });
    hitung.observe(hargaBox);
}

/* ===== Kartu miring halus + kilau cahaya mengikuti kursor (hanya di perangkat dengan mouse) ===== */
if (!kurangiGerak && matchMedia("(hover: hover)").matches) {
    document.querySelectorAll(".kartu").forEach(kartu => {
        const foto = kartu.querySelector(".bingkai");
        kartu.addEventListener("mousemove", e => {
            const r = kartu.getBoundingClientRect();
            const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
            kartu.style.transform = `perspective(900px) rotateY(${(x - .5) * 6}deg) rotateX(${(.5 - y) * 6}deg) translateY(-6px)`;
            foto.style.setProperty("--mx", x * 100 + "%");
            foto.style.setProperty("--my", y * 100 + "%");
        });
        kartu.addEventListener("mouseleave", () => { kartu.style.transform = ""; });
    });
}


/* ===== Carousel testimoni: tombol kanan-kiri dan swipe ===== */
(() => {
    const carousel = document.querySelector(".testimoni-carousel");
    if (!carousel) return;

    const viewport = carousel.querySelector(".testimoni-viewport");
    const track = carousel.querySelector(".testimoni-track");
    const cards = Array.from(track.querySelectorAll(".testimoni-card"));
    const tombolPrev = carousel.querySelector(".testimoni-prev");
    const tombolNext = carousel.querySelector(".testimoni-next");
    const dotsContainer = carousel.querySelector(".testimoni-dots");

    if (!cards.length || !viewport || !tombolPrev ||
        !tombolNext || !dotsContainer) return;

    let indeks = 0;
    let jumlahTerlihat = 3;
    let posisiMula = 0;
    let posisiAkhir = 0;

    function aturJumlahTerlihat() {
        if (window.matchMedia("(max-width: 575px)").matches) {
            return 1;
        }

        if (window.matchMedia("(max-width: 991px)").matches) {
            return 2;
        }

        return 3;
    }

    function indeksMaksimum() {
        return Math.max(0, cards.length - jumlahTerlihat);
    }

    function buatDots() {
        dotsContainer.innerHTML = "";
        const totalPosisi = indeksMaksimum() + 1;

        for (let i = 0; i < totalPosisi; i++) {
            const dot = document.createElement("button");
            dot.type = "button";
            dot.className = "testimoni-dot";
            dot.setAttribute("aria-label", `Lihat posisi testimoni ${i + 1}`);

            dot.addEventListener("click", () => {
                indeks = i;
                perbaruiCarousel();
            });

            dotsContainer.appendChild(dot);
        }
    }

    function perbaruiCarousel() {
        indeks = Math.max(0, Math.min(indeks, indeksMaksimum()));

        const jarak = parseFloat(getComputedStyle(track).gap) || 0;
        const lebarCard = cards[0].getBoundingClientRect().width;
        const geser = indeks * (lebarCard + jarak);

        track.style.transform = `translateX(-${geser}px)`;

        tombolPrev.disabled = indeks === 0;
        tombolNext.disabled = indeks === indeksMaksimum();

        const dots = dotsContainer.querySelectorAll(".testimoni-dot");

        dots.forEach((dot, i) => {
            const aktif = i === indeks;
            dot.classList.toggle("aktif", aktif);
            dot.setAttribute("aria-current", aktif ? "true" : "false");
        });
    }

    function aturCarousel() {
        jumlahTerlihat = aturJumlahTerlihat();
        buatDots();
        perbaruiCarousel();
    }

    tombolPrev.addEventListener("click", () => {
        indeks--;
        perbaruiCarousel();
    });

    tombolNext.addEventListener("click", () => {
        indeks++;
        perbaruiCarousel();
    });

    /* Geser card dengan sentuhan di HP */
    viewport.addEventListener("touchstart", event => {
        posisiMula = event.changedTouches[0].clientX;
        posisiAkhir = posisiMula;
    }, { passive: true });

    viewport.addEventListener("touchmove", event => {
        posisiAkhir = event.changedTouches[0].clientX;
    }, { passive: true });

    viewport.addEventListener("touchend", () => {
        const selisih = posisiMula - posisiAkhir;

        if (Math.abs(selisih) < 45) return;

        if (selisih > 0 && indeks < indeksMaksimum()) {
            indeks++;
        } else if (selisih < 0 && indeks > 0) {
            indeks--;
        }

        perbaruiCarousel();
    }, { passive: true });

    window.addEventListener("resize", aturCarousel);

    aturCarousel();
})();


/* ===== Autoplay carousel testimoni ===== */
(() => {
    const carousel = document.querySelector(".testimoni-carousel");
    if (!carousel) return;

    const track = carousel.querySelector(".testimoni-track");
    const cards = Array.from(track.querySelectorAll(".testimoni-card"));
    if (cards.length <= 1) return;

    let timer;
    const jeda = 3000; // Jeda 3 detik

    function jumlahTerlihat() {
        if (window.matchMedia("(max-width: 575px)").matches) return 1;
        if (window.matchMedia("(max-width: 991px)").matches) return 2;
        return 3;
    }

    function geserOtomatis() {
        const maksimal = Math.max(0, cards.length - jumlahTerlihat());

        // Kembali ke awal setelah mencapai card terakhir
        const transform = getComputedStyle(track).transform;
        const matrix = new DOMMatrixReadOnly(transform);
        const posisi = Math.abs(matrix.m41);

        const gap = parseFloat(getComputedStyle(track).gap) || 0;
        const lebar = cards[0].getBoundingClientRect().width;
        const indeksSekarang = Math.round(posisi / (lebar + gap));

        const berikutnya = indeksSekarang >= maksimal ? 0 : indeksSekarang + 1;

        const tombol = carousel.querySelectorAll(".testimoni-dot");
        if (tombol[berikutnya]) {
            tombol[berikutnya].click();
        }
    }

    function mulaiOtomatis() {
        clearInterval(timer);
        timer = setInterval(geserOtomatis, jeda);
    }

    function berhentiOtomatis() {
        clearInterval(timer);
    }

    carousel.addEventListener("mouseenter", berhentiOtomatis);
    carousel.addEventListener("mouseleave", mulaiOtomatis);
    carousel.addEventListener("focusin", berhentiOtomatis);
    carousel.addEventListener("focusout", mulaiOtomatis);

    // Mulai bergerak otomatis
    mulaiOtomatis();

    // Sesuaikan posisi saat ukuran layar berubah
    window.addEventListener("resize", () => {
        berhentiOtomatis();
        mulaiOtomatis();
    });
})();

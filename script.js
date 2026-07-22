/**
 * GONZAGA ELÉTRICA - Logic Core v8.0 (Enterprise)
 */
const IMG_RESERVA = "https://via.placeholder.com/250?text=Imagem+Indisponivel";
const ZAP_NUMERO = "5511988923919";

// Segurança: Sanitização básica
const sanitizeHTML = (str) => {
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
};

// UX: Normalização de Strings para Busca Inteligente
const normalizeStr = (str) => {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
};

function carregarProdutos(lista) {
    const grid = document.getElementById('products-grid');
    if (!grid) return; 

    grid.innerHTML = ""; 
    const contador = document.getElementById('product-count');
    
    if (lista.length === 0) {
        grid.innerHTML = `<div class="empty-state"><i class="fa-solid fa-box-open"></i><p>Nenhum produto encontrado.</p></div>`;
        if(contador) contador.textContent = "0 produtos";
        return;
    }

    if(contador) contador.textContent = `${lista.length} produtos encontrados`;

    lista.forEach(p => {
        const safeNome = sanitizeHTML(p.nome);
        const safeSku = sanitizeHTML(p.sku);
        const card = document.createElement('article');
        card.className = 'product-card';
        card.innerHTML = `
            <a href="produto.html?sku=${safeSku}" class="card-link" aria-label="Ver detalhes de ${safeNome}">
                <div class="img-wrapper">
                    <img src="${p.imagem}" loading="lazy" alt="${safeNome}" class="prod-img">
                </div>
                <h3 class="card-title">${safeNome}</h3>
            </a>
            <button class="btn-consultar" onclick="consultarZapGeral('${safeNome}', '${safeSku}')" aria-label="Consultar ${safeNome} no WhatsApp">
                <i class="fa-brands fa-whatsapp"></i> Consultar
            </button>
        `;
        grid.appendChild(card);
    });

    document.querySelectorAll('.prod-img').forEach(img => {
        img.addEventListener('error', function handler() {
            this.src = IMG_RESERVA;
            this.removeEventListener('error', handler);
        });
    });
}

function consultarZapGeral(nome, sku) {
    const msg = `Olá Gonzaga Elétrica! Gostaria de consultar o preço e disponibilidade de: ${nome} (REF: ${sku})`;
    window.open(`https://wa.me/${ZAP_NUMERO}?text=${encodeURIComponent(msg)}`, '_blank');
}

function getProductBadges(produto) {
    if (Array.isArray(produto.badges) && produto.badges.length) {
        return produto.badges.map((badge) => {
            if (typeof badge === 'string') {
                return { label: badge, icon: 'fa-tag', className: 'badge-delivery' };
            }
            return {
                label: badge.label,
                icon: badge.icon || 'fa-tag',
                className: badge.className || 'badge-delivery'
            };
        });
    }

    const badges = [];
    const specs = produto.especificacoes || {};
    const tensao = normalizeStr(specs.tensao || '');

    if (tensao.includes('bivolt')) {
        badges.push({ label: 'Bivolt', icon: 'fa-bolt', className: 'badge-bivolt' });
    }
    if (produto.categoria === 'eletrica' || produto.categoria === 'ferramentas') {
        badges.push({ label: 'Uso Industrial', icon: 'fa-industry', className: 'badge-industrial' });
    }
    if (produto.categoria === 'iluminacao') {
        badges.push({ label: 'Pronta Entrega', icon: 'fa-box-open', className: 'badge-delivery' });
    }
    if (specs.marca && normalizeStr(specs.marca).includes('tramontina')) {
        badges.push({ label: 'Tramontina (Original)', icon: 'fa-certificate', className: 'badge-original' });
    }

    if (!badges.length) {
        badges.push({ label: 'Pronta Entrega', icon: 'fa-box-open', className: 'badge-delivery' });
    }

    return badges.slice(0, 3);
}

function formatSpecLabel(chave) {
    const mapa = {
        tensao: 'Voltagem',
        watts: 'Potência',
        potencia: 'Potência',
        curva: 'Curva',
        corrente: 'Corrente',
        capacidade: 'Capacidade',
        marca: 'Marca',
        material: 'Material',
        tipo: 'Tipo',
        base: 'Base',
        tamanho: 'Tamanho',
        cor: 'Cor',
        articulacao: 'Articulação'
    };

    return mapa[chave] || chave.charAt(0).toUpperCase() + chave.slice(1);
}

function getSpecIcon(chave) {
    const mapa = {
        tensao: 'fa-bolt',
        watts: 'fa-gauge-high',
        potencia: 'fa-gauge-high',
        curva: 'fa-arrows-spin',
        corrente: 'fa-bolt',
        capacidade: 'fa-layer-group',
        marca: 'fa-certificate',
        material: 'fa-gears',
        tipo: 'fa-list-check',
        base: 'fa-plug',
        tamanho: 'fa-ruler',
        cor: 'fa-palette',
        articulacao: 'fa-arrows-rotate'
    };

    return mapa[chave] || 'fa-circle-info';
}

function renderTechHighlights(produto) {
    const especificacoes = produto.especificacoes || {};
    const destaqueKeys = ['tensao', 'watts', 'potencia', 'curva', 'corrente', 'capacidade', 'marca', 'material', 'tipo', 'base', 'tamanho'];
    const destaques = [];

    destaqueKeys.forEach((chave) => {
        const valor = especificacoes[chave];
        if (valor) {
            destaques.push({ chave, label: formatSpecLabel(chave), valor, icon: getSpecIcon(chave) });
        }
    });

    if (!destaques.length) {
        Object.entries(especificacoes).slice(0, 4).forEach(([chave, valor]) => {
            if (valor) {
                destaques.push({ chave, label: formatSpecLabel(chave), valor, icon: getSpecIcon(chave) });
            }
        });
    }

    return destaques.slice(0, 4).map(({ label, valor, icon }) => `
        <div class="tech-card">
            <div class="tech-card-icon"><i class="fa-solid ${icon}"></i></div>
            <div>
                <span>${sanitizeHTML(label)}</span>
                <strong>${sanitizeHTML(valor)}</strong>
            </div>
        </div>
    `).join('');
}

function renderRelatedProducts(produto) {
    const container = document.getElementById('related-products');
    if (!container) return;

    const relacionados = Array.isArray(produto.relacionados) && produto.relacionados.length
        ? produtos.filter((item) => produto.relacionados.includes(item.sku)).slice(0, 4)
        : produtos.filter((item) => item.sku !== produto.sku && item.categoria === produto.categoria).slice(0, 4);

    if (!relacionados.length) {
        container.innerHTML = '';
        return;
    }

    container.innerHTML = `
        <h2>Quem comprou, também levou</h2>
        <div class="related-grid">
            ${relacionados.map((item) => `
                <article class="related-card">
                    <img src="${item.imagem}" alt="${sanitizeHTML(item.nome)}" loading="lazy">
                    <h3>${sanitizeHTML(item.nome)}</h3>
                    <a href="produto.html?sku=${encodeURIComponent(item.sku)}">Ver detalhes</a>
                </article>
            `).join('')}
        </div>
    `;
}

function setMainImage(src, alt) {
    const image = document.getElementById('detalhe-imagem');
    if (!image) return;
    image.src = src;
    image.alt = alt;
    image.style.setProperty('--zoom-scale', '1');
    image.onerror = () => {
        image.src = IMG_RESERVA;
        image.alt = 'Imagem indisponível';
    };
}

function configurarZoomImagem(container, image, preview, produto) {
    const MIN_SCALE = 1;
    const MAX_SCALE = 3;
    let scale = 1;
    let pinchStartDistance = null;
    let pinchStartScale = 1;

    const atualizarZoom = (novaEscala) => {
        scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, novaEscala));
        image.style.setProperty('--zoom-scale', scale.toFixed(2));
        container.classList.toggle('is-zoomed', scale > 1);
        if (scale <= 1) {
            preview.classList.remove('active');
        }
    };

    const getTouchDistance = (touches) => {
        const [a, b] = touches;
        return Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
    };

    container.addEventListener('wheel', (event) => {
        event.preventDefault();
        const delta = event.deltaY > 0 ? -0.1 : 0.1;
        atualizarZoom(scale + delta);
    }, { passive: false });

    container.addEventListener('mousemove', (event) => {
        if (scale <= 1) {
            const rect = container.getBoundingClientRect();
            preview.style.left = `${event.clientX - rect.left}px`;
            preview.style.top = `${event.clientY - rect.top}px`;
            preview.style.backgroundImage = `url('${image.currentSrc || image.src}')`;
            preview.classList.add('active');
        } else {
            preview.classList.remove('active');
        }
    });

    container.addEventListener('mouseleave', () => preview.classList.remove('active'));

    container.addEventListener('touchstart', (event) => {
        if (event.touches.length === 2) {
            pinchStartDistance = getTouchDistance(event.touches);
            pinchStartScale = scale;
        }
    }, { passive: false });

    container.addEventListener('touchmove', (event) => {
        if (event.touches.length === 2 && pinchStartDistance) {
            event.preventDefault();
            const distance = getTouchDistance(event.touches);
            const ratio = distance / pinchStartDistance;
            atualizarZoom(pinchStartScale * ratio);
        }
    }, { passive: false });

    container.addEventListener('touchend', () => {
        pinchStartDistance = null;
    });

    container.addEventListener('click', (event) => {
        if (scale > 1) {
            event.preventDefault();
            atualizarZoom(1);
        } else {
            openImageZoom(image.currentSrc || image.src, produto.nome);
        }
    });

    image.addEventListener('dblclick', () => {
        atualizarZoom(scale > 1 ? 1 : 1.8);
    });
}

function openImageZoom(src, alt) {
    let modal = document.getElementById('image-zoom-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'image-zoom-modal';
        modal.className = 'image-zoom-modal';
        modal.innerHTML = `
            <div class="image-zoom-content" role="dialog" aria-modal="true" aria-label="Visualização ampliada">
                <button type="button" class="image-zoom-close" aria-label="Fechar visualização"><i class="fa-solid fa-xmark"></i></button>
                <img src="" alt="">
                <p class="image-zoom-caption"></p>
            </div>
        `;
        modal.addEventListener('click', (event) => {
            if (event.target === modal || event.target.closest('.image-zoom-close')) {
                modal.classList.remove('active');
            }
        });
        document.body.appendChild(modal);
    }

    const img = modal.querySelector('img');
    const caption = modal.querySelector('.image-zoom-caption');
    img.src = src;
    img.alt = alt;
    caption.textContent = alt;
    modal.classList.add('active');
}

function carregarGaleria(produto) {
    const gallery = document.querySelector('.product-gallery');
    const thumbs = document.getElementById('gallery-thumbs');
    const mainImage = document.getElementById('detalhe-imagem');
    const zoomButton = document.querySelector('.zoom-hint');

    if (!gallery || !thumbs || !mainImage) return;

    const imagens = Array.isArray(produto.galeria) && produto.galeria.length ? produto.galeria : [produto.imagem];
    const imagensValidas = imagens.filter(Boolean);

    const container = mainImage.parentElement;
    let preview = container.querySelector('.image-preview-cursor');
    if (!preview) {
        preview = document.createElement('div');
        preview.className = 'image-preview-cursor';
        container.appendChild(preview);
    }

    thumbs.innerHTML = imagensValidas.map((src, index) => `
        <button type="button" class="thumb-btn ${index === 0 ? 'active' : ''}" data-src="${src}" aria-label="Ver imagem ${index + 1}">
            <img src="${src}" alt="${sanitizeHTML(produto.nome)}" loading="lazy">
        </button>
    `).join('');

    const setActiveThumb = (src) => {
        thumbs.querySelectorAll('.thumb-btn').forEach((button) => {
            button.classList.toggle('active', button.getAttribute('data-src') === src);
        });
    };

    const trocarImagem = (src) => {
        setMainImage(src, produto.nome);
        setActiveThumb(src);
        preview.classList.remove('active');
    };

    trocarImagem(imagensValidas[0]);

    thumbs.querySelectorAll('.thumb-btn').forEach((button) => {
        button.addEventListener('click', () => trocarImagem(button.getAttribute('data-src')));
    });

    configurarZoomImagem(container, mainImage, preview, produto);

    if (zoomButton) {
        zoomButton.addEventListener('click', () => openImageZoom(mainImage.currentSrc || mainImage.src, produto.nome));
    }
}

function preencherDetalhesProduto(sku) {
    const produto = produtos.find((item) => item.sku === sku);

    if (!produto) {
        const layout = document.querySelector('.product-layout');
        if (layout) {
            layout.innerHTML = '<h2>Produto não encontrado.</h2>';
        }
        return;
    }

    const nome = document.getElementById('detalhe-nome');
    const skuEl = document.getElementById('detalhe-sku');
    const descricao = document.getElementById('detalhe-descricao');
    const badges = document.getElementById('product-badges');
    const specsBody = document.getElementById('specs-body');
    const buttonZap = document.getElementById('btn-whats-detalhe');

    if (nome) nome.textContent = produto.nome;
    if (skuEl) skuEl.textContent = `REF: ${produto.sku}`;
    if (descricao) descricao.textContent = produto.descricao || 'Descrição em breve. Consulte nossa equipe para mais detalhes.';
    if (badges) {
        badges.innerHTML = getProductBadges(produto).map((badge) => `
            <span class="product-badge ${badge.className}">
                <i class="fa-solid ${badge.icon}"></i>${sanitizeHTML(badge.label)}
            </span>
        `).join('');
    }
    if (specsBody) {
        specsBody.innerHTML = renderTechHighlights(produto);
    }

    carregarGaleria(produto);
    renderRelatedProducts(produto);

    if (buttonZap) {
        buttonZap.onclick = () => consultarZapGeral(produto.nome, produto.sku);
    }
}

// Inicialização Global
document.addEventListener('DOMContentLoaded', () => {
    if (typeof produtos === 'undefined') {
        console.error('Banco de dados de produtos não foi carregado. Verifique o arquivo bancodedados.js.');
        return;
    }

    if(document.getElementById('products-grid')) {
        carregarProdutos(produtos);
    }

    if (document.getElementById('detalhe-nome')) {
        const params = new URLSearchParams(window.location.search);
        const skuUrl = params.get('sku') ? params.get('sku').replace(/[^a-zA-Z0-9-]/g, '') : null;
        if (skuUrl) {
            preencherDetalhesProduto(skuUrl);
        }
    }

    const searchInput = document.getElementById('main-search');
    if(searchInput) {
        searchInput.addEventListener('input', (e) => {
            const termo = normalizeStr(e.target.value);
            const filtrados = produtos.filter(p => 
                normalizeStr(p.nome).includes(termo) || 
                normalizeStr(p.sku).includes(termo)
            );
            carregarProdutos(filtrados);
        });
    }

    document.querySelectorAll('.category-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const cat = item.getAttribute('data-category');
            
            document.querySelectorAll('.category-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            
            const filtrados = (cat === 'todos' || !cat) ? produtos : produtos.filter(p => p.categoria === cat);
            carregarProdutos(filtrados);
            
            const titulo = document.getElementById('current-category-name');
            if (titulo) titulo.textContent = item.textContent.trim();
        });
    });
});
const client = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


const contentGrid =
    document.getElementById(
        "contentGrid"
    );


const featuredGrid =
    document.getElementById(
        "featuredGrid"
    );


const nextPageButton =
    document.getElementById(
        "nextPageButton"
    );


let currentPage = 0;

const ITEMS_PER_PAGE = 12;


/* -------------------------
   STORAGE URL
------------------------- */

function getFileUrl(path) {

    if (!path) {
        return "";
    }

    const {
        data
    } = client.storage
        .from("videos")
        .getPublicUrl(path);

    return data.publicUrl;
}


/* -------------------------
   SITE SETTINGS
------------------------- */

async function loadSiteSettings() {

    const {
        data,
        error
    } = await client
        .from("site_settings")
        .select("*")
        .eq("id", 1)
        .maybeSingle();


    if (error) {

        console.error(error);

        return;
    }


    if (!data) {
        return;
    }


    document.title =
        data.site_name ||
        "My Video Site";


    document.getElementById(
        "siteLogo"
    ).textContent =
        data.site_name ||
        "My Video Site";


    document.getElementById(
        "heroTitle"
    ).textContent =
        data.hero_title ||
        "Welcome";


    document.getElementById(
        "heroDescription"
    ).textContent =
        data.hero_description ||
        "";


    document.getElementById(
        "footerText"
    ).textContent =
        data.footer_text ||
        "";


    if (data.show_hero === false) {

        document.getElementById(
            "heroSection"
        ).style.display = "none";

    }

}


/* -------------------------
   CONTENT CARD
------------------------- */

function createContentCard(item) {

    const card =
        document.createElement("article");


    card.className =
        "content-card";


    const link =
        document.createElement("a");


    link.href =
        "video.html?id=" +
        encodeURIComponent(
            item.id
        );


    const image =
        document.createElement("img");


    let thumbnail =
        getFileUrl(
            item.thumbnail_path
        );


    if (!thumbnail) {

        thumbnail =
            getFileUrl(
                item.file_path
            );

    }


    image.src = thumbnail;

    image.alt =
        item.title || "Content";

    image.loading = "lazy";


    const title =
        document.createElement("h3");


    title.textContent =
        item.title;


    const type =
        document.createElement("span");


    type.className =
        "content-type";


    type.textContent =
        item.media_type === "photo"
            ? "PHOTO"
            : "VIDEO";


    link.appendChild(image);

    link.appendChild(type);

    link.appendChild(title);


    card.appendChild(link);


    return card;
}


/* -------------------------
   FEATURED CONTENT
------------------------- */

async function loadFeatured() {

    featuredGrid.innerHTML =
        "<p>Loading...</p>";


    const {
        data,
        error
    } = await client
        .from("videos")
        .select("*")
        .eq("featured", true)
        .eq("published", true)
        .order(
            "sort_order",
            {
                ascending: true
            }
        )
        .order(
            "created_at",
            {
                ascending: false
            }
        )
        .limit(6);


    if (error) {

        console.error(error);

        featuredGrid.innerHTML =
            "<p>Could not load featured content.</p>";

        return;
    }


    featuredGrid.innerHTML = "";


    if (!data || data.length === 0) {

        featuredGrid.innerHTML =
            "<p>No featured content yet.</p>";

        return;
    }


    data.forEach(function(item) {

        featuredGrid.appendChild(
            createContentCard(item)
        );

    });

}


/* -------------------------
   LATEST CONTENT
------------------------- */

async function loadContent() {

    contentGrid.innerHTML =
        "<p>Loading...</p>";


    const from =
        currentPage *
        ITEMS_PER_PAGE;


    const to =
        from +
        ITEMS_PER_PAGE -
        1;


    const {
        data,
        error
    } = await client
        .from("videos")
        .select("*")
        .eq("published", true)
        .order(
            "sort_order",
            {
                ascending: true
            }
        )
        .order(
            "created_at",
            {
                ascending: false
            }
        )
        .range(from, to);


    if (error) {

        console.error(error);

        contentGrid.innerHTML =
            "<p>Could not load content.</p>";

        return;
    }


    contentGrid.innerHTML = "";


    if (!data || data.length === 0) {

        contentGrid.innerHTML =
            "<p>No more content.</p>";

        nextPageButton.style.display =
            "none";

        return;
    }


    data.forEach(function(item) {

        contentGrid.appendChild(
            createContentCard(item)
        );

    });


    nextPageButton.style.display =
        data.length === ITEMS_PER_PAGE
            ? "block"
            : "none";

}


/* -------------------------
   NEXT PAGE
------------------------- */

nextPageButton.addEventListener(
    "click",
    function() {

        currentPage++;

        loadContent();

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    }
);


/* -------------------------
   START
------------------------- */

async function init() {

    await loadSiteSettings();

    await loadFeatured();

    await loadContent();

}


init();

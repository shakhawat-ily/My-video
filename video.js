const client = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


const params =
    new URLSearchParams(
        window.location.search
    );


const contentId =
    params.get("id");


const container =
    document.getElementById(
        "contentContainer"
    );


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

async function loadSettings() {

    const {
        data
    } = await client
        .from("site_settings")
        .select("*")
        .eq("id", 1)
        .maybeSingle();


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
        "footerText"
    ).textContent =
        data.footer_text ||
        "";

}


/* -------------------------
   LOAD CONTENT
------------------------- */

async function loadContent() {

    if (!contentId) {

        container.innerHTML =
            "<p>Content not found.</p>";

        return;
    }


    const {
        data: item,
        error
    } = await client
        .from("videos")
        .select("*")
        .eq("id", contentId)
        .eq("published", true)
        .maybeSingle();


    if (error) {

        console.error(error);

        container.innerHTML =
            "<p>Could not load content.</p>";

        return;
    }


    if (!item) {

        container.innerHTML =
            "<p>Content not found.</p>";

        return;
    }


    container.innerHTML = "";


    const title =
        document.createElement("h1");


    title.textContent =
        item.title;


    container.appendChild(title);


    if (
        item.media_type ===
        "photo"
    ) {

        const image =
            document.createElement("img");


        image.src =
            getFileUrl(
                item.file_path
            );


        image.alt =
            item.title;


        image.className =
            "single-media";


        container.appendChild(
            image
        );

    }


    else {

        const video =
            document.createElement("video");


        video.controls = true;

        video.playsInline = true;

        video.preload = "metadata";


        video.className =
            "single-media";


        video.src =
            getFileUrl(
                item.file_path
            );


        if (item.thumbnail_path) {

            video.poster =
                getFileUrl(
                    item.thumbnail_path
                );

        }


        container.appendChild(
            video
        );

    }


    if (item.description) {

        const description =
            document.createElement("p");


        description.className =
            "content-description";


        description.textContent =
            item.description;


        container.appendChild(
            description
        );

    }


    await setupNavigation(
        item
    );

}


/* -------------------------
   PREVIOUS / NEXT
------------------------- */

async function setupNavigation(
    current
) {

    const {
        data
    } = await client
        .from("videos")
        .select(
            "id,title,created_at,sort_order"
        )
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
        );


    if (!data) {
        return;
    }


    const index =
        data.findIndex(
            item =>
                item.id ===
                current.id
        );


    const previous =
        index > 0
            ? data[index - 1]
            : null;


    const next =
        index <
        data.length - 1
            ? data[index + 1]
            : null;


    const previousButton =
        document.getElementById(
            "previousButton"
        );


    const nextButton =
        document.getElementById(
            "nextButton"
        );


    if (previous) {

        previousButton.onclick =
            function() {

                window.location.href =
                    "video.html?id=" +
                    encodeURIComponent(
                        previous.id
                    );

            };

    }

    else {

        previousButton.disabled =
            true;

    }


    if (next) {

        nextButton.onclick =
            function() {

                window.location.href =
                    "video.html?id=" +
                    encodeURIComponent(
                        next.id
                    );

            };

    }

    else {

        nextButton.disabled =
            true;

    }

}


async function init() {

    await loadSettings();

    await loadContent();

}


init();

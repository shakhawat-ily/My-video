const client = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


const loginBox =
    document.getElementById("loginBox");

const adminPanel =
    document.getElementById("adminPanel");

const loginMessage =
    document.getElementById("loginMessage");

const uploadMessage =
    document.getElementById("uploadMessage");

const settingsMessage =
    document.getElementById("settingsMessage");


async function isCurrentUserAdmin() {

    const {
        data: { user }
    } = await client.auth.getUser();

    if (!user) {
        return false;
    }

    const { data, error } = await client
        .from("admins")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();

    if (error) {
        console.error(error);
        return false;
    }

    return !!data;
}


async function checkSession() {

    const {
        data: { session }
    } = await client.auth.getSession();


    if (!session) {

        loginBox.style.display = "block";
        adminPanel.style.display = "none";

        return;
    }


    const admin = await isCurrentUserAdmin();


    if (!admin) {

        loginBox.style.display = "block";
        adminPanel.style.display = "none";

        loginMessage.textContent =
            "This account is not an administrator.";

        await client.auth.signOut();

        return;
    }


    loginBox.style.display = "none";
    adminPanel.style.display = "block";


    const {
        data: { user }
    } = await client.auth.getUser();


    document.getElementById("adminEmail")
        .textContent = user.email;


    await loadDashboard();
    await loadSettings();
    await loadContent();
}


document
    .getElementById("loginForm")
    .addEventListener("submit", async function(event) {

        event.preventDefault();


        loginMessage.textContent =
            "Logging in...";


        const email =
            document
                .getElementById("email")
                .value
                .trim();


        const password =
            document
                .getElementById("password")
                .value;


        const { data, error } =
            await client.auth.signInWithPassword({
                email,
                password
            });


        if (error) {

            loginMessage.textContent =
                "Login failed: " +
                error.message;

            return;
        }


        if (!data.session) {

            loginMessage.textContent =
                "Login failed: No session.";

            return;
        }


        checkSession();

    });


document
    .getElementById("logoutButton")
    .addEventListener("click", async function() {

        await client.auth.signOut();

        location.reload();

    });


/* -------------------------
   DASHBOARD
------------------------- */

async function loadDashboard() {

    const { data, error } =
        await client
            .from("videos")
            .select(
                "id,media_type,featured"
            );


    if (error) {

        console.error(error);

        return;
    }


    const items = data || [];


    const videos =
        items.filter(
            item => item.media_type === "video"
        );


    const photos =
        items.filter(
            item => item.media_type === "photo"
        );


    const featured =
        items.filter(
            item => item.featured === true
        );


    document.getElementById("totalCount")
        .textContent = items.length;


    document.getElementById("videoCount")
        .textContent = videos.length;


    document.getElementById("photoCount")
        .textContent = photos.length;


    document.getElementById("featuredCount")
        .textContent = featured.length;
}


/* -------------------------
   FILE UPLOAD
------------------------- */

async function uploadFile(
    file,
    path
) {

    const { error } =
        await client.storage
            .from("videos")
            .upload(
                path,
                file,
                {
                    contentType: file.type,
                    upsert: false
                }
            );


    if (error) {
        throw error;
    }


    return path;
}


/* -------------------------
   VIDEO THUMBNAIL
------------------------- */

function createVideoThumbnail(file) {

    return new Promise(function(resolve, reject) {

        const video =
            document.createElement("video");


        const canvas =
            document.createElement("canvas");


        const url =
            URL.createObjectURL(file);


        video.src = url;

        video.muted = true;

        video.preload = "metadata";


        video.addEventListener(
            "loadeddata",
            function() {

                video.currentTime = 0.1;

            }
        );


        video.addEventListener(
            "seeked",
            function() {

                canvas.width =
                    video.videoWidth;

                canvas.height =
                    video.videoHeight;


                const context =
                    canvas.getContext("2d");


                context.drawImage(
                    video,
                    0,
                    0,
                    canvas.width,
                    canvas.height
                );


                canvas.toBlob(
                    function(blob) {

                        URL.revokeObjectURL(url);

                        if (!blob) {

                            reject(
                                new Error(
                                    "Could not create thumbnail."
                                )
                            );

                            return;
                        }


                        resolve(blob);

                    },
                    "image/jpeg",
                    0.85
                );

            }
        );


        video.addEventListener(
            "error",
            function() {

                URL.revokeObjectURL(url);

                reject(
                    new Error(
                        "Could not read video."
                    )
                );

            }
        );

    });
}


/* -------------------------
   UPLOAD CONTENT
------------------------- */

document
    .getElementById("uploadForm")
    .addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();


            uploadMessage.textContent =
                "Uploading...";


            try {

                const title =
                    document
                        .getElementById("contentTitle")
                        .value
                        .trim();


                const description =
                    document
                        .getElementById("contentDescription")
                        .value
                        .trim();


                const mediaType =
                    document
                        .getElementById("mediaType")
                        .value;


                const contentFile =
                    document
                        .getElementById("contentFile")
                        .files[0];


                const thumbnailFile =
                    document
                        .getElementById("thumbnailFile")
                        .files[0];


                const featured =
                    document
                        .getElementById("featured")
                        .checked;


                if (!contentFile) {

                    throw new Error(
                        "Please select a file."
                    );

                }


                if (
                    mediaType === "video" &&
                    !contentFile.type.startsWith("video/")
                ) {

                    throw new Error(
                        "Please select a valid video."
                    );

                }


                if (
                    mediaType === "photo" &&
                    !contentFile.type.startsWith("image/")
                ) {

                    throw new Error(
                        "Please select a valid image."
                    );

                }


                const id =
                    crypto.randomUUID();


                const extension =
                    contentFile.name
                        .split(".")
                        .pop();


                const contentPath =
                    "content/" +
                    id +
                    "." +
                    extension;


                await uploadFile(
                    contentFile,
                    contentPath
                );


                let thumbnailPath = null;


                if (thumbnailFile) {

                    const thumbExtension =
                        thumbnailFile.name
                            .split(".")
                            .pop();


                    thumbnailPath =
                        "thumbnails/" +
                        id +
                        "." +
                        thumbExtension;


                    await uploadFile(
                        thumbnailFile,
                        thumbnailPath
                    );

                }


                else if (
                    mediaType === "video"
                ) {

                    uploadMessage.textContent =
                        "Creating video thumbnail...";


                    const thumbnailBlob =
                        await createVideoThumbnail(
                            contentFile
                        );


                    thumbnailPath =
                        "thumbnails/" +
                        id +
                        ".jpg";


                    await uploadFile(
                        thumbnailBlob,
                        thumbnailPath
                    );

                }


                else {

                    thumbnailPath =
                        contentPath;

                }


                const { error } =
                    await client
                        .from("videos")
                        .insert({

                            title: title,

                            description:
                                description,

                            file_path:
                                contentPath,

                            thumbnail_path:
                                thumbnailPath,

                            media_type:
                                mediaType,

                            featured:
                                featured,

                            published:
                                true,

                            sort_order:
                                0

                        });


                if (error) {

                    await client.storage
                        .from("videos")
                        .remove([
                            contentPath
                        ]);


                    if (thumbnailPath) {

                        await client.storage
                            .from("videos")
                            .remove([
                                thumbnailPath
                            ]);

                    }


                    throw error;

                }


                uploadMessage.textContent =
                    "Content uploaded successfully.";


                document
                    .getElementById("uploadForm")
                    .reset();


                await loadDashboard();
                await loadContent();

            }


            catch (error) {

                console.error(error);


                uploadMessage.textContent =
                    "Upload failed: " +
                    error.message;

            }

        }
    );


/* -------------------------
   CONTENT LIST
------------------------- */

async function loadContent() {

    const container =
        document.getElementById(
            "contentList"
        );


    container.textContent =
        "Loading...";


    const { data, error } =
        await client
            .from("videos")
            .select("*")
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


    if (error) {

        container.textContent =
            error.message;

        return;
    }


    container.innerHTML = "";


    if (!data || data.length === 0) {

        container.textContent =
            "No content available.";

        return;
    }


    data.forEach(function(item) {

        const wrapper =
            document.createElement("div");


        wrapper.className =
            "admin-content-item";


        const info =
            document.createElement("div");


        info.className =
            "admin-content-info";


        const title =
            document.createElement("strong");


        title.textContent =
            item.title;


        const meta =
            document.createElement("small");


        meta.textContent =
            item.media_type.toUpperCase();


        info.appendChild(title);

        info.appendChild(meta);


        const controls =
            document.createElement("div");


        controls.className =
            "admin-content-controls";


        const featureButton =
            document.createElement("button");


        featureButton.textContent =
            item.featured
                ? "Unfeature"
                : "Feature";


        featureButton.addEventListener(
            "click",
            function() {

                updateContent(
                    item.id,
                    {
                        featured:
                            !item.featured
                    }
                );

            }
        );


        const publishButton =
            document.createElement("button");


        publishButton.textContent =
            item.published
                ? "Hide"
                : "Publish";


        publishButton.addEventListener(
            "click",
            function() {

                updateContent(
                    item.id,
                    {
                        published:
                            !item.published
                    }
                );

            }
        );


        const editButton =
            document.createElement("button");


        editButton.textContent =
            "Edit";


        editButton.addEventListener(
            "click",
            function() {

                editContent(item);

            }
        );


        const deleteButton =
            document.createElement("button");


        deleteButton.textContent =
            "Delete";


        deleteButton.className =
            "delete-button";


        deleteButton.addEventListener(
            "click",
            function() {

                deleteContent(item);

            }
        );


        controls.appendChild(
            featureButton
        );

        controls.appendChild(
            publishButton
        );

        controls.appendChild(
            editButton
        );

        controls.appendChild(
            deleteButton
        );


        wrapper.appendChild(info);

        wrapper.appendChild(controls);


        container.appendChild(wrapper);

    });

}


/* -------------------------
   UPDATE CONTENT
------------------------- */

async function updateContent(
    id,
    changes
) {

    const { error } =
        await client
            .from("videos")
            .update(changes)
            .eq("id", id);


    if (error) {

        alert(
            "Update failed: " +
            error.message
        );

        return;
    }


    await loadDashboard();

    await loadContent();
}


/* -------------------------
   EDIT CONTENT
------------------------- */

async function editContent(item) {

    const title =
        prompt(
            "Enter new title:",
            item.title
        );


    if (title === null) {
        return;
    }


    const description =
        prompt(
            "Enter new description:",
            item.description || ""
        );


    if (description === null) {
        return;
    }


    await updateContent(
        item.id,
        {
            title:
                title.trim(),

            description:
                description.trim(),

            updated_at:
                new Date().toISOString()
        }
    );

}


/* -------------------------
   DELETE CONTENT
------------------------- */

async function deleteContent(item) {

    const confirmed =
        confirm(
            "Delete this content permanently?"
        );


    if (!confirmed) {
        return;
    }


    const files = [];


    if (item.file_path) {
        files.push(item.file_path);
    }


    if (
        item.thumbnail_path &&
        item.thumbnail_path !== item.file_path
    ) {

        files.push(
            item.thumbnail_path
        );

    }


    if (files.length > 0) {

        const { error } =
            await client.storage
                .from("videos")
                .remove(files);


        if (error) {

            alert(
                "File deletion failed: " +
                error.message
            );

            return;
        }

    }


    const { error } =
        await client
            .from("videos")
            .delete()
            .eq("id", item.id);


    if (error) {

        alert(
            "Database deletion failed: " +
            error.message
        );

        return;
    }


    await loadDashboard();

    await loadContent();
}


/* -------------------------
   WEBSITE SETTINGS
------------------------- */

async function loadSettings() {

    const { data, error } =
        await client
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


    document.getElementById("siteName")
        .value =
        data.site_name || "";


    document.getElementById("heroTitle")
        .value =
        data.hero_title || "";


    document.getElementById("heroDescription")
        .value =
        data.hero_description || "";


    document.getElementById("footerText")
        .value =
        data.footer_text || "";


    document.getElementById("showHero")
        .checked =
        data.show_hero !== false;
}


document
    .getElementById("settingsForm")
    .addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();


            settingsMessage.textContent =
                "Saving...";


            try {

                const siteName =
                    document
                        .getElementById("siteName")
                        .value
                        .trim();


                const heroTitle =
                    document
                        .getElementById("heroTitle")
                        .value
                        .trim();


                const heroDescription =
                    document
                        .getElementById("heroDescription")
                        .value
                        .trim();


                const footerText =
                    document
                        .getElementById("footerText")
                        .value
                        .trim();


                const showHero =
                    document
                        .getElementById("showHero")
                        .checked;


                const logoFile =
                    document
                        .getElementById("logoFile")
                        .files[0];


                let logoPath = null;


                if (logoFile) {

                    const extension =
                        logoFile.name
                            .split(".")
                            .pop();


                    logoPath =
                        "site/logo." +
                        extension;


                    await uploadFile(
                        logoFile,
                        logoPath
                    );

                }


                const changes = {

                    site_name:
                        siteName,

                    hero_title:
                        heroTitle,

                    hero_description:
                        heroDescription,

                    footer_text:
                        footerText,

                    show_hero:
                        showHero,

                    updated_at:
                        new Date().toISOString()

                };


                if (logoPath) {

                    changes.logo_path =
                        logoPath;

                }


                const { error } =
                    await client
                        .from("site_settings")
                        .update(changes)
                        .eq("id", 1);


                if (error) {
                    throw error;
                }


                settingsMessage.textContent =
                    "Website settings saved.";

            }


            catch (error) {

                console.error(error);


                settingsMessage.textContent =
                    "Settings error: " +
                    error.message;

            }

        }
    );


document
    .getElementById("refreshButton")
    .addEventListener(
        "click",
        async function() {

            await loadDashboard();

            await loadContent();

        }
    );


checkSession();

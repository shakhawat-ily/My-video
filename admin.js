const { createClient } = supabase;

const client = createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


const loginBox =
    document.getElementById("loginBox");

const adminPanel =
    document.getElementById("adminPanel");


async function checkLogin() {

    const {
        data: {
            session
        }
    } = await client.auth.getSession();


    if (session) {

        loginBox.style.display = "none";

        adminPanel.style.display = "block";

        loadAdminVideos();

    } else {

        loginBox.style.display = "block";

        adminPanel.style.display = "none";

    }
}


document
    .getElementById("loginForm")
    .addEventListener("submit", async function(event) {

        event.preventDefault();


        const email =
            document.getElementById("email").value;

        const password =
            document.getElementById("password").value;

        const message =
            document.getElementById("loginMessage");


        message.textContent = "Logging in...";


        const { error } =
            await client.auth.signInWithPassword({
                email: email,
                password: password
            });


        if (error) {

            message.textContent =
                "Login failed.";

            console.error(error);

            return;
        }


        message.textContent = "";

        checkLogin();

    });


document
    .getElementById("logoutButton")
    .addEventListener("click", async function() {

        await client.auth.signOut();

        checkLogin();

    });


document
    .getElementById("uploadForm")
    .addEventListener("submit", async function(event) {

        event.preventDefault();


        const title =
            document.getElementById("videoTitle")
                .value.trim();


        const description =
            document.getElementById("videoDescription")
                .value.trim();


        const file =
            document.getElementById("videoFile")
                .files[0];


        const message =
            document.getElementById("uploadMessage");


        if (!file) {

            message.textContent =
                "Please select a video.";

            return;
        }


        if (!file.type.startsWith("video/")) {

            message.textContent =
                "Please select a valid video file.";

            return;
        }


        message.textContent =
            "Uploading...";


        const extension =
            file.name.split(".").pop();


        const fileName =
            crypto.randomUUID() +
            "." +
            extension;


        const { error: uploadError } =
            await client.storage
                .from("videos")
                .upload(
                    fileName,
                    file,
                    {
                        contentType: file.type,
                        upsert: false
                    }
                );


        if (uploadError) {

            message.textContent =
                "Upload failed.";

            console.error(uploadError);

            return;
        }


        const { error: databaseError } =
            await client
                .from("videos")
                .insert({
                    title: title,
                    description: description,
                    file_path: fileName
                });


        if (databaseError) {

            await client.storage
                .from("videos")
                .remove([fileName]);


            message.textContent =
                "Could not save video information.";

            console.error(databaseError);

            return;
        }


        message.textContent =
            "Video uploaded successfully.";


        document
            .getElementById("uploadForm")
            .reset();


        loadAdminVideos();

    });


async function loadAdminVideos() {

    const container =
        document.getElementById(
            "adminVideoList"
        );


    const { data, error } =
        await client
            .from("videos")
            .select("*")
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


    if (error) {

        container.textContent =
            "Unable to load videos.";

        console.error(error);

        return;
    }


    container.innerHTML = "";


    if (!data || data.length === 0) {

        container.textContent =
            "No videos uploaded.";

        return;
    }


    data.forEach(function(video) {

        const item =
            document.createElement("div");


        item.className =
            "admin-video-item";


        const title =
            document.createElement("strong");

        title.textContent =
            video.title;


        const deleteButton =
            document.createElement("button");

        deleteButton.textContent =
            "Delete";

        deleteButton.className =
            "delete-button";


        deleteButton.addEventListener(
            "click",
            function() {

                deleteVideo(
                    video.id,
                    video.file_path
                );

            }
        );


        item.appendChild(title);

        item.appendChild(deleteButton);

        container.appendChild(item);

    });

}


async function deleteVideo(
    id,
    filePath
) {

    const confirmed =
        confirm(
            "Delete this video?"
        );


    if (!confirmed) {
        return;
    }


    const { error: storageError } =
        await client.storage
            .from("videos")
            .remove([filePath]);


    if (storageError) {

        alert("Could not delete video.");

        console.error(storageError);

        return;
    }


    const { error: databaseError } =
        await client
            .from("videos")
            .delete()
            .eq("id", id);


    if (databaseError) {

        alert("Could not delete video record.");

        console.error(databaseError);

        return;
    }


    loadAdminVideos();

}


checkLogin();

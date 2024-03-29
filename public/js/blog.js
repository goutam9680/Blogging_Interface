let blogId = decodeURI(location.pathname.split("/").pop());
let docRef = db.collection("blogs").doc(blogId);
const banner = document.querySelector('.banner');

docRef.get().then((doc) => {
    if (doc.exists) {
        setupBlog(doc.data());
    } else {
        location.replace("/");
    }
})

const setupBlog = async (data) => {
    const banner = document.querySelector('.banner');
    const blogTitle = document.querySelector('.title');
    const titleTag = document.querySelector('title');
    const publish = document.querySelector('.published');

    const storage = firebase.storage();
    const storageRef = storage.ref();

    banner.style.backgroundImage = `url(${data.bannerImage})`;

    titleTag.innerHTML += blogTitle.innerHTML = data.title;
    publish.innerHTML = data.publishedAt;
    publish.innerHTML += `-- ${data.author}`;

    try {
        if (data.author == auth.currentUser.email.split('@')[0]) {
            let editBtn = document.getElementById('edit-blog-btn');
            editBtn.style.display = "inline";
            editBtn.href = `${blogId}/editor`;
        }
    } catch {
        //do nothing here
    }

};

// social share links

const whatsappBtn = document.querySelector(".whatsapp-btn");
const twitterBtn = document.querySelector(".twitter-btn");
const facebookBtn = document.querySelector(".facebook-btn");
const linkedinBtn = document.querySelector(".linkedin-btn");

function init() {
    let postUrl = encodeURI(document.location.href);
    let postTitle = encodeURI("Hii everyone, please check this out: ");

    whatsappBtn.setAttribute("href", `https://api.whatsapp.com/send?text=${postTitle}${postUrl}`);
    twitterBtn.setAttribute("href", `https://twitter.com/share?url=${postUrl}&text=${postTitle}`);
    facebookBtn.setAttribute("href", `https://www.facebook.com/sharer.php?u=${postUrl}`);
    linkedinBtn.setAttribute("href", `https://www.linkedin.com/shareArticle?url=${postUrl}&title=${postTitle}`);

}

init();

const addArticle = (ele, data) => {
    data = data.split("\n").filter(item => item.length);
    // console.log(data);

    data.forEach(item => {
        // check for heading
        if (item[0] == '#') {
            let hCount = 0;
            let i = 0;
            while (item[i] == '#') {
                hCount++;
                i++;
            }
            let tag = `h${hCount}`;
            ele.innerHTML += `<${tag}>${item.slice(hCount, item.length)}</${tag}>`
        }
        //checking for image format
        else if (item[0] == "!" && item[1] == "[") {
            let seperator;

            for (let i = 0; i <= item.length; i++) {
                if (item[i] == "]" && item[i + 1] == "(" && item[item.length - 1] == ")") {
                    seperator = i;
                }
            }

            let alt = item.slice(2, seperator);
            let src = item.slice(seperator + 2, item.length - 1);
            ele.innerHTML += `
            <img src="${src}" alt="${alt}" class="article-image">
            `;
        }

        else {
            ele.innerHTML += `<p>${item}</p>`;
        }
    })
}

async function getBlogData() {
    try {
        loadingScreen.style.display = 'block';
        const doc = await docRef.get();
        if (doc.exists) {
            const data = doc.data();
            setupBlog(data);
            addArticle(document.querySelector('.article'), data.article);
        } else {
            location.replace("/");
        }
    } catch (error) {
        console.error(error);
    } finally {
        loadingScreen.style.display = 'none';
    }
}

getBlogData();

// Add a click event listener to the report button
const reportBlog = () => {
    const blogId = decodeURI(location.pathname.split("/").pop());
    const reportRef = db.collection("blogs").doc(blogId).collection("reports");

    // Check if the user has already reported the blog
    reportRef.doc(auth.currentUser.uid).get().then((doc) => {
        if (doc.exists) {
            alert("You have already reported this blog.");
        } else {
            // Report the blog
            reportRef.doc(auth.currentUser.uid).set({
                reportedAt: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => {
                // Check if the blog has reached the report threshold (10 reports)
                reportRef.get().then((snapshot) => {
                    if (snapshot.size >= 10) {
                        // Delete the blog
                        db.collection("blogs").doc(blogId).delete().then(() => {
                            alert("This blog has been deleted due to multiple reports.");
                            location.replace("/");
                        }).catch((error) => {
                            console.error("Error deleting blog:", error);
                        });
                    } else {
                        alert("Thank you for reporting this blog. Your report has been recorded.");
                    }
                }).catch((error) => {
                    console.error("Error getting report count:", error);
                });
            }).catch((error) => {
                console.error("Error reporting blog:", error);
            });
        }
    }).catch((error) => {
        console.error("Error checking report:", error);
    });
};

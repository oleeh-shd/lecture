document
    .getElementById("simpleForm")
    .addEventListener("submit", function (event) {
        event.preventDefault(); // Останавливаем отправку формы

        // Получаем значения полей формы
        const firstName = document.getElementById("firstName").value;
        const lastName = document.getElementById("lastName").value;
        const email = document.getElementById("email").value;

        // Подготовка данных для отправки
        const data = {
            firstName: firstName,
            lastName: lastName,
            email: email,
        };

        // Отправляем данные на бекенд
        fetch("http://localhost:3000/submit", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        })
            .then((response) => response.json())
            .then((data) => {
                console.log("Success:", data);
                alert("Form submitted successfully!");
            })
            .catch((error) => {
                console.error("Error:", error);
                alert("An error occurred.");
            });
    });

// Получение списка пользователей
document.getElementById("getUsersBtn").addEventListener("click", function () {
    fetch("http://localhost:3000/users")
        .then((response) => response.json())
        .then((data) => {
            const userList = document.getElementById("userList");
            userList.innerHTML = ""; // Очищаем список перед обновлением

            if (data.users && data.users.length > 0) {
                const ul = document.createElement("ul");

                data.users.forEach((user) => {
                    const li = document.createElement("li");

                    li.textContent = `Name: ${user.first_name} Last Name: ${user.last_name}, Email: ${user.email}`;
                    ul.appendChild(li);
                });
                userList.appendChild(ul);
            } else {
                userList.textContent = "No users found.";
            }
        })
        .catch((error) => console.error("Error fetching users:", error));
});

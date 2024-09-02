document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();  // Prevenir el envío normal del formulario

    const formData = new FormData(this);

    fetch('/controller/login.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())  // Asegurarse de que el backend envíe respuesta en formato JSON
    .then(data => {
        if (data.session_valid) {
            Swal.fire({
                icon: 'success',
                title: '¡Iniciaste sesión correctamente!',
                text: 'Bienvenido de nuevo, ' + data.username, // Asegúrate de enviar 'username' desde el backend si es necesario
                timer: 5000,
                timerProgressBar: true
            }).then((result) => {
                // Almacenar el token y el tipo de usuario en sessionStorage
                sessionStorage.setItem('token', data.token);
                // Redirigir según el tipo de usuario
                if (data.userType === 'admin') {
                    window.location.href = '/administrador/';  // URL para administradores
                } else if (data.userType === 'tecnico') {
                    window.location.href = '/tecnico/Clientes';  // URL para técnicos
                } else {
                    window.location.href = '/dashboard/';  // URL para otros tipos de usuarios
                }
            });
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error al iniciar sesión',
                text: data.message
            });
        }
    })
    .catch(error => {
        Swal.fire({
            icon: 'error',
            title: 'Error de conexión',
            text: 'No se pudo conectar al servidor: ' + error.message
        });
        console.error('Error:', error);
    });
});

window.addEventListener(
    'load',
    // TODO: REPLACE LOGIN-FORM WITH FORM
    function () {
        let loginForm = document.getElementById('login-form');
        loginForm.addEventListener(
            'submit',
            function () {
                let allRequiredFilled = true;
                loginForm.querySelectorAll('[required]').forEach(function (i) {
                    if (!allRequiredFilled) {
                        return;
                    }
                    if (!i.value) {
                        allRequiredFilled = false;
                        return;
                    }
                });

                if (allRequiredFilled) {
                    document.getElementById('confirmation-container').style =
                        'display: unset';
                }
            },
            false
        );
    },
    false
);

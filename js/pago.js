$(document).ready(function () {
    // Variables para el control de caja
    let cashTotal = parseFloat(sessionStorage.getItem('cashTotal')) || 0;
    let cardTotal = parseFloat(sessionStorage.getItem('cardTotal')) || 0;
    let generalTotal = parseFloat(sessionStorage.getItem('generalTotal')) || 0;
    let totalCashTransactions = 0;
    let totalCardTransactions = 0;
    let totalGeneralTransactions = 0;

    // Mostrar los valores iniciales
    updateTotals();

    // Establecer la fecha actual en el campo de fecha de la factura
    const today = new Date().toISOString().split('T')[0];
    $('#invoice-date').text(today);

    // Obtener Facturas y actualizar la tabla
    function loadInvoices() {
        $.ajax({
            url: '/Controller/get_invoices.php',
            type: 'GET',
            dataType: 'json',
            success: function (response) {
                const invoices = response.data;
                let tableBody = '';
                const today = new Date();
                const oneMonthAgo = new Date(today);
                oneMonthAgo.setMonth(today.getMonth() - 1);

                invoices.forEach(invoice => {
                    const invoicePeriod = new Date(invoice.from);
                    let periodHtml = invoice.from;

                    if (invoicePeriod < oneMonthAgo) {
                        periodHtml = `<span class="badge bg-danger">${invoice.from}</span>`;
                    } else if (invoicePeriod.getMonth.toString() === today.getMonth.toString()) {
                        periodHtml = `<span class="badge bg-info">${invoice.from}</span>`;
                    }

                    if (invoice.state === 'pending') {
                        tableBody += `
                        <tr>
                            <td>${invoice.id}</td>
                            <td>${invoice.invoice_number}</td>
                            <td>${invoice.issued_at}</td>
                            <td>${invoice.client_national_identification_number}</td>
                            <td>${invoice.client_name}</td>
                            <td>${periodHtml}</td>
                            <td>${invoice.state === 'pending' ? 'pendiente' : invoice.state}</td>
                            <td>${invoice.amount}</td>
                            <td><button class="btn btn-primary pay-btn" data-id="${invoice.id}" data-client-name="${invoice.client_name}" data-amount="${invoice.balance}">Pagar</button></td>
                        </tr>
                    `;
                    }
                });

                // Destruir instancia previa de DataTables
                if ($.fn.DataTable.isDataTable('#invoiceTable')) {
                    $('#invoiceTable').DataTable().destroy();
                }

                // Actualizar el cuerpo de la tabla
                $('#invoiceTableBody').html(tableBody);

                // Inicializar DataTables con configuración en español
                $('#invoiceTable').DataTable({
                    language: {
                        url: "//cdn.datatables.net/plug-ins/1.11.3/i18n/es_es.json"
                    }
                });

                // Configurar los botones de pago
                $('.pay-btn').on('click', function () {
                    const invoiceId = $(this).data('id');
                    const clientName = $(this).data('client-name');
                    const amount = $(this).data('amount');
                    const subTotal = (amount / 1.15).toFixed(2);
                    const tax = (amount - subTotal).toFixed(2);

                    // Obtener detalles del cliente por nombre
                    $.ajax({
                        url: '/Controller/get_clients.php',
                        type: 'GET',
                        data: { client_name: clientName },
                        dataType: 'json',
                        success: function (response) {
                            const client = response.data[0]; // Supongamos que solo hay un cliente con ese nombre

                            $('#client_id').val(client.id);
                            $('#client_name').val(client.name);
                            $('#invoice_ids').val(invoiceId);
                            $('#sub_total').text(`L.${subTotal}`);
                            $('#tax').text(`L.${tax}`);
                            $('#amount').text(`L.${amount}`);
                            $('#paymentModal').modal('show');
                        },
                        error: function (error) {
                            showToast('Hubo un problema al obtener los detalles del cliente.', 'negative');
                        }
                    });
                });
            },
            error: function (error) {
                showToast('Hubo un problema al obtener las facturas.', 'negative');
            }
        });
    }

    // Cargar las facturas al inicio
    loadInvoices();

    // Mostrar/ocultar campos según el método de pago
    $('#payment_method').on('change', function () {
        if ($(this).val() === 'cash') {
            $('#cash_amount_container').show();
        } else {
            $('#cash_amount_container').hide();
            $('#cash_amount').val('');
            $('#change').text('Vuelto: L.0.00');
        }
    });

    // Calcular el vuelto
    $('#cash_amount').on('input', function () {
        const cashReceived = parseFloat($(this).val());
        const amountToPay = parseFloat($('#amount').text().replace('L.', ''));
        if (!isNaN(cashReceived) && cashReceived >= amountToPay) {
            const change = (cashReceived - amountToPay).toFixed(2);
            $('#change').text(`Vuelto: L.${change}`);
        } else {
            $('#change').text('Vuelto: L.0.00');
        }
    });

    // Enviar Pago
    $('#paymentForm').on('submit', function (event) {
        event.preventDefault();

        const formData = {
            client_id: $('#client_id').val(),
            invoice_ids: $('#invoice_ids').val().split(',').map(id => id.trim()),
            amount: parseFloat($('#amount').text().replace('L.', '')),
            payment_date: $('#invoice-date').text(),
            comment: $('#comment').val(),
            rtn: $('#rtn').val(),
            payment_method: $('#payment_method').val(),
            cash_amount: $('#cash_amount').val()
        };

        $.ajax({
            url: '/Controller/send_payment.php',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(formData),
            success: function (response) {
                Swal.fire({
                    title: 'Éxito!',
                    text: 'El pago ha sido enviado correctamente.',
                    icon: 'success',
                    confirmButtonText: 'OK'
                });
                $('#paymentModal').modal('hide');

                // Actualizar el control de caja
                const amount = parseFloat($('#amount').text().replace('L.', ''));
                const paymentMethod = $('#payment_method').val();

                if (paymentMethod === 'cash') {
                    cashTotal += amount;
                    totalCashTransactions += 1;
                    sessionStorage.setItem('cashTotal', cashTotal.toFixed(2));
                } else {
                    cardTotal += amount;
                    totalCardTransactions += 1;
                    sessionStorage.setItem('cardTotal', cardTotal.toFixed(2));
                }

                totalGeneralTransactions += 1;
                generalTotal = cashTotal + cardTotal;
                sessionStorage.setItem('generalTotal', generalTotal.toFixed(2));
                updateTotals();

                // Recargar las facturas
                loadInvoices();
                showToast('El pago ha sido enviado correctamente.', 'positive');
            },
            error: function (error) {
                showToast('Hubo un problema al enviar el pago.', 'negative');
            }
        });
    });

    // Inicializar el toast
    var toastEl = document.getElementById('notificationToast');
    var toast = new bootstrap.Toast(toastEl);

    function showToast(message, type) {
        toastEl.querySelector('.toast-body').textContent = message;
        if (type === 'positive') {
            toastEl.classList.remove('bg-danger');
            toastEl.classList.add('bg-success');
        } else if (type === 'negative') {
            toastEl.classList.remove('bg-success');
            toastEl.classList.add('bg-danger');
        }
        toast.show();
    }

    // Funcionalidades de apertura y cierre de caja
    $('#startDayBtn').on('click', function () {
        $(this).hide(); // Esconde el botón "Iniciar Día"
        $('#initialBalanceModal').modal('show'); // Muestra el modal para ingresar saldo inicial
    });

    $('#initialBalanceForm').on('submit', function (event) {
        event.preventDefault();
        const initialBalance = parseFloat($('#initial_balance_modal').val());
        if (!isNaN(initialBalance)) {
            cashTotal = initialBalance;
            sessionStorage.setItem('cashTotal', cashTotal.toFixed(2));
            generalTotal = cashTotal + cardTotal;
            sessionStorage.setItem('generalTotal', generalTotal.toFixed(2));
            updateTotals();
            $('#initialBalanceModal').modal('hide');
            showToast('El día ha comenzado. Saldo inicial registrado.', 'positive');
        } else {
            showToast('Por favor ingrese un saldo inicial válido.', 'negative');
        }
    });

    $('#endDayBtn').on('click', function () {
        const initialBalance = parseFloat(sessionStorage.getItem('cashTotal'));
        const expectedTotal = initialBalance + generalTotal;
        $('#initialBalance').text(`L.${initialBalance.toFixed(2)}`);
        $('#totalGeneralTransactions').text(`L.${generalTotal.toFixed(2)}`);
        $('#numCashTransactions').text(totalCashTransactions);
        $('#numCardTransactions').text(totalCardTransactions);
        $('#numGeneralTransactions').text(totalGeneralTransactions);
        $('#dayClosure').show();
        Swal.fire({
            title: 'Cierre de Día',
            html: `<p>Saldo Inicial: L.${initialBalance.toFixed(2)}</p>
                   <p>Total General: L.${generalTotal.toFixed(2)}</p>
                   <p>Total de Transacciones en Efectivo: ${totalCashTransactions}</p>
                   <p>Total de Transacciones con Tarjeta: ${totalCardTransactions}</p>
                   <p>Total de Transacciones Generales: ${totalGeneralTransactions}</p>`,
            icon: 'info',
            confirmButtonText: 'OK'
        });
    });

    $('#saveClosureBtn').on('click', function () {
        const closureData = {
            initialBalance: parseFloat($('#initialBalance').text().replace('L.', '')),
            totalGeneral: parseFloat($('#totalGeneralTransactions').text().replace('L.', '')),
            numCashTransactions: parseInt($('#numCashTransactions').text()),
            numCardTransactions: parseInt($('#numCardTransactions').text()),
            numGeneralTransactions: parseInt($('#numGeneralTransactions').text())
        };

        // Aquí puedes realizar una solicitud AJAX para guardar los datos de cierre
        console.log('Guardando cierre de caja', closureData);
        showToast('El cierre de caja ha sido guardado correctamente.', 'positive');
    });

    // Función para actualizar los totales en la interfaz
    function updateTotals() {
        $('#cashTotal').text(`L.${cashTotal.toFixed(2)}`);
        $('#cardTotal').text(`L.${cardTotal.toFixed(2)}`);
        $('#generalTotal').text(`L.${generalTotal.toFixed(2)}`);
    }
});

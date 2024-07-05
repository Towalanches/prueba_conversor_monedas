document.addEventListener('DOMContentLoaded', function () {
    const selectorDesplegable = document.getElementById('monedas-select')
    const selectorActivador = document.querySelector('#monedas-select ~ .selector-activador')
    const opcionesPersonalizadas = document.getElementById('custom-options')
    const cantidadInput = document.getElementById('input-clp')
    const conversor = document.getElementById('convertir')
    const total = document.getElementById('resultado')
    const tituloGrafico = document.getElementById('grafico-titulo')
    const grafica = document.querySelector('.grafica')


    let divisa = {}
    let variacionHistorica = {}
    let monedaSeleccionada = null

    // Función para agregar las opciones de moneda
    function rellenarSelectOpciones() {
        const monedas = ['dolar', 'euro', 'uf']
        monedas.forEach(moneda => {
            const opcion = document.createElement('option')
            opcion.value = moneda
            opcion.textContent = moneda.toUpperCase()

            const divOpciones = document.createElement('div')
            divOpciones.setAttribute('data-value', moneda)
            divOpciones.textContent = moneda.toUpperCase()

            selectorDesplegable.appendChild(opcion)
            opcionesPersonalizadas.appendChild(divOpciones)

            divOpciones.addEventListener('click', function () {
                selectorDesplegable.value = moneda
                selectorActivador.textContent = moneda.toUpperCase()
                opcionesPersonalizadas.classList.remove('open')
                monedaSeleccionada = moneda
                getVariacionHistorica(moneda)
            })
        })
    }

    // Función asíncrona para obtener los datos de la API
    async function getMonedas() {
        try {
            const res = await fetch('https://mindicador.cl/api')
            const data = await res.json()
            divisa = {
                dolar: data.dolar.valor,
                euro: data.euro.valor,
                uf: data.uf.valor
            }
            rellenarSelectOpciones(data)
        } catch (error) {
            console.error('Error al obtener los datos:', error)
            mostrarError('Error al cargar los indicadores, intentelo denuevo más tarde.')
        }
    }

    // Llamar a la función getMonedas al cargar la página
    getMonedas()

    // Abrir/cerrar el custom select
    selectorActivador.addEventListener('click', function () {
        opcionesPersonalizadas.classList.toggle('open')
    })

    // Cerrar el custom select al hacer clic fuera
    document.addEventListener('click', function (event) {
        if (!selectorDesplegable.parentElement.contains(event.target)) {
            opcionesPersonalizadas.classList.remove('open')
        }
    })

    // Función para convertir la moneda
    function convertirMoneda(cantidad, desde, hasta) {
        if (desde === 'clp') {
            const desdeDivisa = 1
            const hastaDivisa = divisa[hasta]
            return cantidad / hastaDivisa
        } else if (hasta === 'clp') {
            const desdeDivisa = divisa[desde]
            const hastaDivisa = 1
            return cantidad * desdeDivisa
        } else {
            const desdeDivisa = divisa[desde]
            const hastaDivisa = divisa[hasta]
            return (cantidad / desdeDivisa) * hastaDivisa
        }
    }

    // Evento de clic en el botón de convertir
    conversor.addEventListener('click', function () {
        const cantidad = parseFloat(cantidadInput.value)
        const desdeDivisa = 'clp' // Siempre se convierte desde CLP
        const hastaDivisa = selectorDesplegable.value

        if (!monedaSeleccionada) {
            mostrarError('Por favor, selecciona una moneda.')
            return
        }

        if (isNaN(cantidad)) {
            mostrarError('Por favor, ingresa una cantidad válida.')
            return
        }
        const resultado = convertirMoneda(cantidad, desdeDivisa, hastaDivisa)
        total.textContent = `Resultado: ${resultado.toFixed(2)} ${hastaDivisa.toUpperCase()}`
    })


    //Funcion para obtener los ultimos 10 días de variación de la moneda seleccionada
    async function getVariacionHistorica(moneda) {
        try {
            const response = await fetch(`https://mindicador.cl/api/${moneda}`)
            const data = await response.json()
            variacionHistorica = data.serie.slice(-10) // Obtener los últimos 10 días
            actualizarGrafico()
            actualizarTituloGrafico(moneda)
            grafica.style.display = 'block'
        } catch (error) {
            console.error('Error al obtener datos históricos:', error)
            mostrarError('Error al obtener datos históricos. Por favor, intenta nuevamente más tarde.')
        }
    }

    // Función para actualizar el título del gráfico
    function actualizarTituloGrafico(moneda) {
        tituloGrafico.innerHTML = `Gráfico de Variación ${moneda.toUpperCase()}<br>últimos 10 días`
    }


    //Funcion para mostrar mensaje de error
    function mostrarError(message) {
        const errorElement = document.createElement('div')
        errorElement.classList.add('mensaje-error')
        errorElement.textContent = message
        total.appendChild(errorElement) //Mostrar mensaje de error abajo del total

        // Eliminar el mensaje después de unos segundos
        setTimeout(() => {
            errorElement.remove()
        }, 5000)
    }

    // Función para inicializar el gráfico con los datos históricos
    function actualizarGrafico() {
        const labels = variacionHistorica.map(entry => entry.fecha.substr(0, 10)) // Fechas formateadas
        const values = variacionHistorica.map(entry => entry.valor) // Valores de la moneda
        if (window.myChart instanceof Chart) {
            window.myChart.data.labels = labels
            window.myChart.data.datasets[0].data = values
            window.myChart.update() // Actualizar el gráfico con los nuevos datos
        } else {
            const grafico = document.getElementById('myChart').getContext('2d')
            window.myChart = new Chart(grafico, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Variación de la Moneda',
                        data: values,
                        backgroundColor: 'rgba(54, 162, 235, 0.2)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1,
                        pointRadius: 7
                    }]
                },
                options: {
                    responsive: false,
                    maintainAspectRatio: true,
                    scales: {
                        y: {
                            beginAtZero: false
                        }
                    }
                }
            })
        }
    }
})

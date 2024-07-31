document.getElementById("uploadButton").addEventListener("click", function(event) {
    event.preventDefault();
    console.log("Upload button clicked");
    const fileInput = document.getElementById('upload');
    const file = fileInput.files[0];

    if (file) {
        console.log('File selected:', file.name);
        const reader = new FileReader();
        reader.onload = function(event) {
            console.log('FileReader onload event');
            const data = new Uint8Array(event.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const excelData = XLSX.utils.sheet_to_json(firstSheet);
            console.log('Parsed Excel data:', excelData);
            sendToServer(excelData);
        };
        reader.onerror = function(event) {
            console.error('FileReader error:', event);
        };
        reader.readAsArrayBuffer(file);
    } else {
        console.error('No file selected');
    }
});

function sendToServer(data) {
    console.log('Sending data to server:', data);
    fetch('http://localhost:5000/upload', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(result => {
        console.log('Server response:', result);
    })
    .catch(error => {
        console.error('Error sending data to server:', error);
    });
}


document.getElementById('downloadButton').addEventListener('click', function(event) {
    event.preventDefault();
    fetch('http://localhost:5000/download')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok.');
            }
            return response.blob();
        })
        .then(blob => {
            const url = window.URL.createObjectURL(blob); // to creates a temporary URL for the Blob object
            const a = document.createElement('a'); // creates the anchor element a
            a.style.display = 'none'; // to hide the anchor element
            a.href = url; //sets the href attribute of the anchor to the temporary URL
            a.download = 'data.xlsx'; // sets the download attribute to specify the name of the file when downloaded
            document.body.appendChild(a); //adds the anchor element to the document body
            a.click(); // simulates a click on the anchor element to trigger the download.
            window.URL.revokeObjectURL(url); //eleases the memory used by the Blob URL once it is no longer needed.
        })
        .catch(error => {
            console.error('There has been a problem with your fetch operation:', error);
        });
        
});


let currentIndex = 0;
document.querySelector('.save-button').addEventListener('click', async (event) => {
    event.preventDefault();
    try {
        const responseLocation = await fetch(`http://localhost:5000/api/next-row?startIndex=${currentIndex}`);
        if (!responseLocation.ok) throw new Error('Network response was not ok');
        const nextLocation = await responseLocation.json();
        document.querySelector('.id').textContent = `Location ID ${nextLocation.locationid}`;

        const responseRows = await fetch(`http://localhost:5000/api/next-three-rows?startIndex=${currentIndex}`);
        if (!responseRows.ok) throw new Error('Network response was not ok');
        const nextRows = await responseRows.json();

        console.log("next-three-rows data is: ", nextRows);
        if (nextRows && nextRows.length > 0) {
            const tableRows = document.querySelectorAll('.container table.table1 tbody tr');

            for (let i = 0; i < nextRows.length; i += 6) {
                for (let j = i; j < i + 3 && j < nextRows.length; j++) {
                    const tableRow = tableRows[j];

                    tableRow.children[1].querySelector('img').src = nextRows[j].photo1;
                    tableRow.children[2].querySelector('img').src = nextRows[j].photo2;
                    tableRow.children[3].querySelector('img').src = nextRows[j].photo3;
                    tableRow.children[4].querySelector('img').src = nextRows[j].photo4;
                    tableRow.children[5].textContent = nextRows[j].num_of_coca_cola_inside;
                    tableRow.children[7].textContent = nextRows[j].num_of_pepsi_fridges_inside;
                    tableRow.children[9].textContent = nextRows[j].others_inside;
                    tableRow.children[11].textContent = nextRows[j].others_outside;
                }
            }
            currentIndex += 3;
        } else {
            console.warn('Less than 3 rows returned from the server.');
        }
        
    } catch (error) {
        console.error('Error fetching next row or updating table:', error);
    }
});

document.querySelector('.next-button').addEventListener('click', function(event) {
    event.preventDefault();
    const rows = document.querySelectorAll('.container .table1 tbody tr');

    const dataToSend = [];

    rows.forEach(row => {
        const cocaColaTF = row.querySelector('td:nth-child(7) select').value;
        const pepsiTF = row.querySelector('td:nth-child(9) select').value;
        const othersInsideTF = row.querySelector('td:nth-child(11) select').value;
        const othersOutsideTF = row.querySelector('td:nth-child(13) select').value;
        
        dataToSend.push({
            cocaColaTF,
            pepsiTF,
            othersInsideTF,
            othersOutsideTF
        });
    });
    console.log("Type of data is:", typeof(dataToSend));

    fetch('http://localhost:5000/save-data', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataToSend)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
        }
        return response.json();
    })
    .then(data => {
        console.log('Success:', data);
    })
    .catch((error) => {
        console.error('Error:', error);
    });    
});

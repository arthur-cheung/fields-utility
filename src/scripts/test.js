var fields = new FieldsUtility(document.querySelector('.fields'), [
    /* {
     "type": "output",
     "label": "Member Id",
     "id": "originalMemberId",
     "value": fileInformation['originalMemberId']
     },
     {
     "type": "output",
     "label": "Date of Birth",
     "id": "dateOfBirth",
     "value": fileInformation['dateOfBirth']
     },
     {
     "type": "output",
     "label": "Employer Id",
     "id": "employerId",
     "value": fileInformation['employerId']
     },
     {
     "type": "output",
     "label": "First Name",
     "id": "firstName",
     "value": fileInformation['givenName']
     },
     {
     "type": "output",
     "label": "TFN",
     "id": "tfn",
     "value": fileInformation['tfn']
     },
     {
     "type": "output",
     "label": "Employer Name",
     "id": "employerName",
     "value": fileInformation['employerName']
     },
     {
     "type": "output",
     "label": "Surname",
     "id": "surname",
     "value": fileInformation['lastName']
     },
     {
     "type": "output",
     "label": "Date of Birth",
     "id": "dateOfBirth",
     "value": fileInformation['dateOfBirth']
     }*/

    {"type": "input", "label": "Request Id", "id": "requestId"},
    {"type": "input", "label": "Member Number", "id": "memberNumber"},
    {"type": "input", "label": "Assigned To", "id": "assignedTo"},
    {"type": "input", "label": "First Name", "id": "firstName"},
    {"type": "date", "label": "Date of Birth", "id": "dateOfBirth"},
    {"type": "select", "label": "Is Active", "id": "isActive", "options": [
        {"name": "True", "value": "True"},
        {"name": "False", "value": "False"}
    ]},
    {"type": "select", "label": "App Version", "id": "appVersion", "options": [
        {"name": "8", "value": "8"},
        {"name": "6", "value": "6"}
    ]}
]
);


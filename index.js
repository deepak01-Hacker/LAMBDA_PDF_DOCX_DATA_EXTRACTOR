const AWS = require('aws-sdk');
const pdf = require('pdf-parse');
var fs = require("fs");
const mammoth = require('mammoth');

const s3 = new AWS.S3();

exports.handler = async (event, context) => {
  try {
    // Parse request data from the API Gateway event
    const requestData = JSON.parse(event.body);

    const s3_parms = { Bucket: requestData.bucket, Key: requestData.key };

    if ( requestData.file_type == 'txt' ){

      const fileData = await s3.getObject(s3_parms).promise();
      const textContent = fileData.Body.toString('utf-8');

      const response = {
        statusCode: 200,
        body: JSON.stringify({ message: 'Text extraction successful', text: textContent }),
      };
      return response;
    }

    if (requestData.file_type == 'pdf'){
      const pdfObject = await s3.getObject(s3_parms).promise();
      const pdfBuffer = pdfObject.Body;

      // Extract text from the PDF using pdf-parse
      const result = await pdf(pdfBuffer);
      const extractedText = result.text;

      // Construct the response
      const response = {
        statusCode: 200,
        body: JSON.stringify({ message: 'PDF text extraction successful', text: extractedText }),
      };

      return response;
    }
    else if (requestData.file_type == 'docx' || requestData.file_type == 'doc'){

      const { Body } = await s3.getObject(s3_parms).promise();
  
      const fileBuffer = Buffer.from(Body);

      const options = {
        styleMap: ['p[style-name=\'Heading 1\'] => h1', 'p[style-name=\'Heading 2\'] => h2'],
      };

      const { value } = await mammoth.extractRawText({ buffer: fileBuffer }, options);

      const response = {
        statusCode: 200,
        body: JSON.stringify({ message: 'Text extraction successful', text: value }),
      };

      return response;
    }
  } catch (error) {
    // Construct an error response
    const response = {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error extracting text from File', error: error.message }),
    };

    return response;
  }
};
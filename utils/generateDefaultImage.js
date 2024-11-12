/* eslint-disable import/no-extraneous-dependencies */
const { createCanvas } = require('canvas');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

exports.CanvasToGenerateImage = async (name) => {
  const canvas = createCanvas(200, 200); // 200x200 pixels
  const ctx = canvas.getContext('2d');

  // Set background color
  ctx.fillStyle = '#cccccc'; // Light gray
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Set text properties
  ctx.font = 'bold 100px Arial';
  ctx.fillStyle = '#ffffff'; // White text
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Draw the first letter of the name
  const firstLetter = name.charAt(0).toUpperCase();
  ctx.fillText(firstLetter, canvas.width / 2, canvas.height / 2);

  // Save image to a file
  const filePath = `./uploads/users/default-user-${uuidv4()}-${Date.now()}.png`;
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(filePath, buffer);

  return filePath;
};



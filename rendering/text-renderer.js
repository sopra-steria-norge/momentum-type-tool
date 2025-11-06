// Text Renderer - Handles text rendering and character positioning

class TextRenderer {
    constructor() {
        this.isLeftAligned = false;
        this.internalHorizontalMargin = 120;
        this.internalVerticalMargin = 120;
        this.internalLineHeightMultiplier = 1.25;
        this.isPlaceholder = false;
    }

    // Set alignment mode
    setAlignment(isLeftAligned) {
        this.isLeftAligned = isLeftAligned;
    }

    // Get alignment mode
    getAlignment() {
        return this.isLeftAligned;
    }

    // Set placeholder state
    setPlaceholderState(isPlaceholder) {
        this.isPlaceholder = isPlaceholder;
    }

    // Get placeholder state
    getPlaceholderState() {
        return this.isPlaceholder;
    }

    // Set internal margins
    setMargins(horizontal, vertical) {
        this.internalHorizontalMargin = Math.max(0, horizontal);
        this.internalVerticalMargin = Math.max(0, vertical);
    }

    // Get internal margins
    getMargins() {
        return {
            horizontal: this.internalHorizontalMargin,
            vertical: this.internalVerticalMargin
        };
    }

    // Set line height multiplier
    setLineHeightMultiplier(multiplier) {
        this.internalLineHeightMultiplier = Math.max(0.5, multiplier);
    }

    // Get line height multiplier
    getLineHeightMultiplier() {
        return this.internalLineHeightMultiplier;
    }

    // Preprocess text into rows
    preProcess(inputText) {
        const paragraphs = inputText.split("\n");
        const allRows = [];

        for (let paragraph of paragraphs) {
            const words = paragraph.trim().split(/\s+/);
            let currentLine = "";

            for (let word of words) {
                if (word.length > 20) {
                    if (currentLine) {
                        allRows.push(currentLine.trim());
                        currentLine = "";
                    }
                    allRows.push(word);
                } else {
                    if ((currentLine + " " + word).trim().length <= 20) {
                        if (currentLine) {
                            currentLine += " " + word;
                        } else {
                            currentLine += word;
                        }
                    } else {
                        if (currentLine) {
                            allRows.push(currentLine.trim());
                        }
                        currentLine = word;
                    }
                }
            }

            if (currentLine) {
                allRows.push(currentLine.trim());
            }
        }

        return allRows;
    }

    // Render a single character
    renderCharacter(ctx, character, x, y, fontSize, userHasTyped, fillColor) {
        // Determine color based on user input state
        let textColor;
        if (userHasTyped) {
            // Actual user content
            textColor = fillColor;
        } else {
            // Placeholder text - light grey with reduced opacity
            textColor = '#c0c0c0';
        }

        if (FontManager.hasFont()) {
            // Use OpenType.js for custom fonts
            const font = FontManager.getFont();
            const path = font.getPath(character.toUpperCase(), x, y, fontSize);

            // Apply reduced opacity for placeholder
            if (!userHasTyped) {
                ctx.save();
                ctx.globalAlpha = 0.4; // Reduced opacity for placeholder
            }

            ctx.fillStyle = textColor;
            ctx.beginPath();
            path.commands.forEach(cmd => {
                switch (cmd.type) {
                    case 'M': ctx.moveTo(cmd.x, cmd.y); break;
                    case 'L': ctx.lineTo(cmd.x, cmd.y); break;
                    case 'C': ctx.bezierCurveTo(cmd.x1, cmd.y1, cmd.x2, cmd.y2, cmd.x, cmd.y); break;
                    case 'Q': ctx.quadraticCurveTo(cmd.x1, cmd.y1, cmd.x, cmd.y); break;
                    case 'Z': ctx.closePath(); break;
                }
            });
            ctx.fill();

            if (!userHasTyped) {
                ctx.restore(); // Restore normal opacity
            }
        } else {
            // Use basic text rendering
            ctx.textAlign = this.isLeftAligned ? 'left' : 'center';
            ctx.textBaseline = 'alphabetic';

            // Apply reduced opacity for placeholder
            if (!userHasTyped) {
                ctx.save();
                ctx.globalAlpha = 0.4; // Reduced opacity for placeholder
            }

            ctx.fillStyle = textColor;
            ctx.font = `${fontSize}px Inter, sans-serif`;
            ctx.fillText(character.toUpperCase(), x, y);

            if (!userHasTyped) {
                ctx.restore(); // Restore normal opacity
            }
        }
    }

    // Get character width
    getCharacterWidth(ctx, character, fontSize) {
        if (FontManager.hasFont()) {
            const font = FontManager.getFont();
            const glyph = font.charToGlyph(character.toUpperCase());
            return glyph.advanceWidth * (fontSize / font.unitsPerEm);
        } else {
            ctx.font = `${fontSize}px Inter, sans-serif`;
            return ctx.measureText(character.toUpperCase()).width;
        }
    }

    // Get font metrics for baseline placement
    getFontMetrics(ctx, fontSize) {
        if (FontManager.hasFont()) {
            const font = FontManager.getFont();
            const unitsPerEm = font.unitsPerEm || 1000;
            const ascent = (font.ascender || 0.8 * unitsPerEm) * (fontSize / unitsPerEm);
            const descent = Math.abs(font.descender || 0.2 * unitsPerEm) * (fontSize / unitsPerEm);
            return { ascent, descent };
        } else {
            ctx.font = `${fontSize}px Inter, sans-serif`;
            const metrics = ctx.measureText('Mg');
            const ascent = metrics.actualBoundingBoxAscent || fontSize * 0.8;
            const descent = metrics.actualBoundingBoxDescent || fontSize * 0.2;
            return { ascent, descent };
        }
    }

    // Calculate character positions for a frame
    calculateCharacterPositions(ctx, words, userHasTyped, animationTime, canvasWidth, canvasHeight) {
        const margin = UIController.getMarginValue();
        const ampl = UIController.getAmplitudeValue();
        const speed = UIController.getSpeedValue();
        const phase = animationTime * speed;
        const additionalPhase = UIController.getPhaseValue();
        const rowOffset = UIController.getVerticalOffsetValue();
        const factor = UIController.getFactorValue();
        const rows = this.preProcess(words);
        const usableWidth = canvasWidth - UIController.getMarginValue() * 2;

        // console.log('[TextRenderer] Calculating positions:', {
        //     words: words.substring(0, 20) + '...',
        //     canvasWidth,
        //     canvasHeight,
        //     margin,
        //     rows: rows.length,
        //     usableWidth
        // });

        const characters = [];
        let rowPosition = 0;
        const usableHeight = canvasHeight - UIController.getMarginValue() * 2;
        let prevRowLineHeight = 0;

        for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
            const row = rows[rowIndex];

            // Calculate font size for the row
            let fontSize;
            if (row.length > 20) {
                fontSize = canvasHeight / this.map(row.length, 20, 60, 15, 40);
            } else {
                fontSize = canvasHeight / 15;
            }

            const rowMetrics = this.getFontMetrics(ctx, fontSize);
            if (rowIndex === 0) {
                rowPosition = UIController.getMarginValue() + rowMetrics.ascent;
            } else {
                rowPosition += prevRowLineHeight;
            }

            if (this.isLeftAligned) {
                // Left alignment: clean cumulative approach
                let x = margin;
                let oscillationOffset = 1;

                for (let charIndex = 0; charIndex < row.length; charIndex++) {
                    const character = row[charIndex];
                    const currentCharWidth = this.getCharacterWidth(ctx, character, fontSize);

                    const angle = phase + additionalPhase + (rowIndex + 1) * rowOffset;
                    const finalX = charIndex == 0 ? margin : x + ((Math.sin(angle) * .5 + .5) * ampl * 5) * oscillationOffset * 1 / row.length * charIndex;

                    characters.push({
                        character: character.toUpperCase(),
                        x: finalX,
                        y: rowPosition,
                        fontSize: fontSize,
                        userHasTyped: userHasTyped
                    });

                    x += currentCharWidth;
                    oscillationOffset *= factor;
                }
            } else {
                // Edge-locked justification: first char at left margin, last char at right margin
                const rowWidths = [];
                let rowTotalWidth = 0;
                for (let i = 0; i < row.length; i++) {
                    const width = this.getCharacterWidth(ctx, row[i], fontSize);
                    rowWidths.push(width);
                    rowTotalWidth += width;
                }

                const gaps = Math.max(row.length - 1, 1);
                const extraSpace = Math.max(usableWidth - rowTotalWidth, 0);
                const gapIncrement = extraSpace / gaps;

                let cumulativeX = UIController.getMarginValue();

                for (let charIndex = 0; charIndex < row.length; charIndex++) {
                    const character = row[charIndex];

                    const waveAngle = (Math.PI / Math.max(row.length, 1)) * charIndex + phase + additionalPhase + (rowIndex + 1) * rowOffset;
                    const baseSineValue = Math.sin(waveAngle) * ampl * 400;

                    let centerAlignmentIntensity;
                    if (row.length > 1) {
                        centerAlignmentIntensity = 1 - Math.abs(this.map(charIndex, 0, row.length - 1, 1, -1));
                    } else {
                        centerAlignmentIntensity = 1;
                    }

                    let horizontalOffset = baseSineValue * centerAlignmentIntensity;
                    if (charIndex === 0 || charIndex === row.length - 1) {
                        horizontalOffset = 0;
                    }

                    const x = cumulativeX + horizontalOffset;

                    characters.push({
                        character: character.toUpperCase(),
                        x: x,
                        y: rowPosition,
                        fontSize: fontSize,
                        userHasTyped: userHasTyped
                    });

                    cumulativeX += rowWidths[charIndex] + (charIndex < row.length - 1 ? gapIncrement : 0);
                }
            }

            prevRowLineHeight = Math.max(fontSize * this.internalLineHeightMultiplier, 10);
        }

        return characters;
    }

    // Utility function to map values from one range to another
    map(value, start1, stop1, start2, stop2) {
        return start2 + (stop2 - start2) * ((value - start1) / (stop1 - start1));
    }

    // Render text to canvas
    render(ctx, words, userHasTyped, animationTime, canvasWidth, canvasHeight, fillColor) {
        const characters = this.calculateCharacterPositions(ctx, words, userHasTyped, animationTime, canvasWidth, canvasHeight);

        // console.log('[TextRenderer] Rendering', characters.length, 'characters');

        for (const char of characters) {
            this.renderCharacter(ctx, char.character, char.x, char.y, char.fontSize, char.userHasTyped, fillColor);
        }
    }

    // Render text for export at fixed resolution (1920x1080)
    renderForExport(ctx, words, userHasTyped, animationTime, exportWidth, exportHeight, fillColor) {
        const characters = this.calculateCharacterPositions(ctx, words, userHasTyped, animationTime, exportWidth, exportHeight);

        for (const char of characters) {
            this.renderCharacter(ctx, char.character, char.x, char.y, char.fontSize, char.userHasTyped, fillColor);
        }
    }
}

// Export singleton instance
window.TextRenderer = new TextRenderer();

export const signCategoryFormInnerHtml = `<div class="form__group">
        <label for="title">Titlu</label>
        <input type="text" id="title" name="title" class="form__input">
    </div>
    <div class="form__group">
        <label for="design">Aspect</label>
        <textarea id="design" name="design" rows="2" class="form__input"></textarea>
    </div>
    <div class="form__group">
        <label for="purpose">Scop</label>
        <textarea id="purpose" name="purpose" rows="2" class="form__input"></textarea>
    </div>
    <div class="form__group">
        <label for="suggestion">Sugestii</label>
        <textarea id="suggestion" name="suggestion" rows="2" class="form__input"></textarea>
    </div>
    <div class="form__group">
        <label for="image-upload">Imagine:</label>
        <div class="form__image">
            <input
                type="file"
                class="form__input"
                id="image-upload"
                name="image-upload"
                accept="image/*"
            />
            <img
                id="image-preview"
                src=""
                alt="Image Preview"
                style="display: none"
            />
            <div class="form__row">
                <button
                    type="button"
                    class="button"
                    id="image-reset"
                    style="display: none"
                >
                    Resetează imaginea
                </button>
            </div>
        </div>
    </div>
    <div class="form__buttons">
        <button type="submit">Confirmă</button>
    </div>`;

export const signFormInnerHtml = `<div class="form__group">
        <label for="title">Titlu</label>
        <input type="text" id="title" name="title" class="form__input">
    </div>
    <div class="form__group">
        <label for="design">Aspect</label>
        <textarea id="design" name="design" rows="2" class="form__input"></textarea>
    </div>
    <div class="form__group">
        <label for="purpose">Scop</label>
        <textarea id="purpose" name="purpose" rows="2" class="form__input"></textarea>
    </div>
    <div class="form__group">
        <label for="suggestion">Sugestii</label>
        <textarea id="suggestion" name="suggestion" rows="2" class="form__input"></textarea>
    </div>
    <div class="form__group">
        <label for="image-upload">Imagine:</label>
        <div class="form__image">
            <input
                type="file"
                class="form__input"
                id="image-upload"
                name="image-upload"
                accept="image/*"
            />
            <img
                id="image-preview"
                src=""
                alt="Image Preview"
                style="display: none"
            />
            <div class="form__row">
                <button
                    type="button"
                    class="button"
                    id="image-reset"
                    style="display: none"
                >
                    Resetează imaginea
                </button>
            </div>
        </div>
    </div>
    <div class="form__buttons">
        <button type="submit">Confirmă</button>
    </div>`;

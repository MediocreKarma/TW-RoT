import {withDatabaseOperation} from "../db.js";
import {ServiceResponse} from "../models/serviceResponse.js";

export const getAllSignCategories = withDatabaseOperation(async function (client) {
    const signCategories = await client.query('select id, title, image_id from sign_category').rows;
    return new ServiceResponse(200, signCategories, 'Successfully retrieved sign categories');
})

export const getSignCategory = withDatabaseOperation(async function (client, id) {
    const categoryInfo = await client.query(
        'select title, design, purpose, suggestion from sign_category where id=$1::int',
        [id],
    ).rows[0]
    const signCategory = await client.query(
        'select s.id, s.title, s.description, s.image_id ' +
            'from sign s join sign_to_category_relation stcr on stcr.sign_id where stcr.category_id = $1::int',
        [id],
    ).rows;
    return new ServiceResponse(200, {category: categoryInfo, signs: signCategory})

})
module.exports = {

    categoryWithChildren: `
        WITH RECURSIVE subcategories (id) AS (
            SELECT id FROM categories WHERE id = ?
            UNION ALL
            SELECT c.id FROM subcategories, categories c
                WHERE "parentId" = subcategories.id
        )
        SELECT id FROM subcategories
    `,

    termInContent: `
        SELECT id FROM articles
        WHERE CAST(content as varchar) LIKE ?
        UNION
        SELECT id FROM articles
        WHERE LOWER(name) LIKE ?
    `
    // SELECT id FROM articles
    // WHERE name LIKE '%escrever%'
}
// this file is a copy of @babel/helper-split-export-declaration with some modification highlighted by // MOD
import * as t from "@babel/types";

export default function splitExportDeclaration(exportDeclaration) {
    if (!exportDeclaration.isExportDeclaration()) {
        throw new Error("Only export declarations can be splitted.");
    }

    // build specifiers that point back to this export declaration
    const isDefault = exportDeclaration.isExportDefaultDeclaration();
    const declaration = exportDeclaration.get("declaration");
    const isClassDeclaration = declaration.isClassDeclaration();

    if (isDefault) {
        const standaloneDeclaration =
            declaration.isFunctionDeclaration() || isClassDeclaration;

        const scope = declaration.isScope()
            ? declaration.scope.parent
            : declaration.scope;

        let id = declaration.node.id;
        let needBindingRegistration = false;

        if (!id) {
            needBindingRegistration = true;

            id = scope.generateUidIdentifier("default");

            if (
                standaloneDeclaration ||
                declaration.isFunctionExpression() ||
                declaration.isClassExpression()
            ) {
                declaration.node.id = t.cloneNode(id);
            }
        }

        // MOD Just return something instead of creating a var bound to an "exports" import
        const updatedDeclaration = standaloneDeclaration
            ? t.returnStatement(t.classExpression(declaration.node.id, null, declaration.node.body))
            : t.returnStatement(declaration.node);


        // MOD Do not include an updated export
        // const updatedExportDeclaration = t.exportNamedDeclaration(null, [
        //     t.exportSpecifier(t.cloneNode(id), t.identifier("default")),
        // ]);

        //exportDeclaration.insertAfter(updatedExportDeclaration);
        exportDeclaration.replaceWith(updatedDeclaration);

        if (needBindingRegistration) {
            scope.registerDeclaration(exportDeclaration);
        }

        return exportDeclaration;
    }

    if (exportDeclaration.get("specifiers").length > 0) {
        throw new Error("It doesn't make sense to split exported specifiers.");
    }

    const bindingIdentifiers = declaration.getOuterBindingIdentifiers();

    const specifiers = Object.keys(bindingIdentifiers).map(name => {
        return t.exportSpecifier(t.identifier(name), t.identifier(name));
    });

    const aliasDeclar = t.exportNamedDeclaration(null, specifiers);

    exportDeclaration.insertAfter(aliasDeclar);
    exportDeclaration.replaceWith(declaration.node);
    return exportDeclaration;
}

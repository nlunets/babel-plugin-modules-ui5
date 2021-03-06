// this file is a copy of @babel/plugin-transform-modules-amd with some modification highlighted by // MOD
import { declare } from "@babel/helper-plugin-utils";
import {
    isModule,
    hasExports,
    isSideEffectImport,
    buildNamespaceInitStatements,
    ensureStatementsHoisted,
    wrapInterop,
} from "@babel/helper-module-transforms";
import { template, types as t } from "@babel/core";
import {rewriteModuleStatementsAndPrepareHeader} from "./helpers/helper-module-transforms";

const buildWrapper = template(`
  sap.ui.define(MODULE_NAME, AMD_ARGUMENTS, function(IMPORT_NAMES) {
  })
`);

export default declare((api, options) => {
    api.assertVersion(7);

const { loose, allowTopLevelThis, strict, strictMode, noInterop } = options;
return {
    name: "transform-modules-amd",

    visitor: {
        Program: {
            exit(path) {
                if (!isModule(path)) return;

                let moduleName = this.getModuleName();
                if (moduleName) moduleName = t.stringLiteral(moduleName);

                const { meta, headers } = rewriteModuleStatementsAndPrepareHeader(
                    path,
                    {
                        loose,
                        strict,
                        strictMode,
                        allowTopLevelThis,
                        noInterop,
                    },
                );

                const amdArgs = [];
                const importNames = [];

                // MOD Do not include the "exports" in the imports

                // if (hasExports(meta)) {
                //   amdArgs.push(t.stringLiteral("exports"));
                //
                //   importNames.push(t.identifier(meta.exportName));
                // }

                for (const [source, metadata] of meta.source) {

                    if (metadata.imports && metadata.imports.size !== 0) {
                        // MOD use an identifier around the metadata.name
                        for (const [subSource, target] of metadata.imports) {
                            amdArgs.push(t.stringLiteral(source + "/" + target));
                            importNames.push(t.identifier(subSource));
                        }
                    }
                    else {
                        amdArgs.push(t.stringLiteral(source));
                        // MOD use an identifier around the metadata.name
                        importNames.push(t.identifier(metadata.name));
                    }


                    if (!isSideEffectImport(metadata)) {
                        const interop = wrapInterop(
                            path,
                            t.identifier(metadata.name),
                            metadata.interop,
                        );
                        if (interop) {
                            const header = t.expressionStatement(
                                t.assignmentExpression(
                                    "=",
                                    t.identifier(metadata.name),
                                    interop,
                                ),
                            );
                            header.loc = metadata.loc;
                            headers.push(header);
                        }
                    }

                    headers.push(
                        ...buildNamespaceInitStatements(meta, metadata, loose),
                );
                }

                ensureStatementsHoisted(headers);
                path.unshiftContainer("body", headers);

                const { body, directives } = path.node;
                path.node.directives = [];
                path.node.body = [];
                const amdWrapper = path.pushContainer("body", [
                    buildWrapper({
                        MODULE_NAME: moduleName,

                        AMD_ARGUMENTS: t.arrayExpression(amdArgs),
                        IMPORT_NAMES: importNames,
                    }),
                ])[0];
                const amdFactory = amdWrapper
                    .get("expression.arguments")
                    .filter(arg => arg.isFunctionExpression())[0]
                    .get("body");
                amdFactory.pushContainer("directives", directives);
                amdFactory.pushContainer("body", body);
            },
        },
    },
};
});

import { NextResponse } from "next/server";
import { Pool } from "pg";
import crypto from "crypto";
import { db } from "../../../../../lib/db";
import { requireAuth } from "../../../../../lib/auth/verifyBearerToken";

const pool = new Pool({
    host: process.env.POSTGIS_HOST,
    port: parseInt(process.env.POSTGIS_PORT),
    user: process.env.POSTGIS_USER,
    password: process.env.POSTGIS_PASSWORD,
    database: process.env.POSTGIS_DB,
});

const DB_SCHEMA = process.env.POSTGIS_SCHEMA;

export async function POST(request) {
    const { payload, error, status } = requireAuth(request, "admin");
    if (error) {
        return NextResponse.json({ message: error }, { status });
    }
    const client = await pool.connect();

    try {
        const formData = await request.formData();
        const file = formData.get("file");
        const layerNameInput = formData.get("layer_name");
        const akses = formData.get("akses");
        const isEditable = formData.get("editable") === "true";

        if (!file || typeof file === "string") {
            return NextResponse.json({ error: "File GeoJSON tidak ditemukan" }, { status: 400 });
        }

        const fileText = await file.text();
        let geojson;
        try {
            geojson = JSON.parse(fileText);
        } catch (e) {
            return NextResponse.json({ error: "Format GeoJSON tidak valid" }, { status: 400 });
        }

        const features = geojson.type === "FeatureCollection" ? geojson.features : [geojson];
        if (!features || features.length === 0) {
            return NextResponse.json({ error: "GeoJSON kosong" }, { status: 400 });
        }

        const rawSampleProps = features[0]?.properties || {};
        const propMap = {};
        Object.keys(rawSampleProps).forEach(rawKey => {
            const cleanKey = rawKey.replace(/[^a-zA-Z0-9_]/g, "_").toLowerCase();
            propMap[cleanKey] = rawKey;
        });

        const cleanPropKeys = Object.keys(propMap);

        const uniqueId = crypto.randomUUID().slice(0, 8);
        const tableName = `${layerNameInput.replace(/[^a-zA-Z0-9_]/g, "_")}_${uniqueId}`.toLowerCase();

        await client.query("BEGIN");

        const columnsSql = cleanPropKeys.length > 0
            ? cleanPropKeys.map(k => `"${k}" TEXT`).join(", ") + ","
            : "";

        await client.query(`
      CREATE TABLE "${DB_SCHEMA}"."${tableName}" (
        id SERIAL PRIMARY KEY,
        ${columnsSql}
        the_geom GEOMETRY(Geometry, 4326)
      );
    `);

        for (const feature of features) {
            const props = feature.properties || {};
            const colNames = ["the_geom"];
            const colValues = ["ST_SetSRID(ST_GeomFromGeoJSON($1), 4326)"];
            const queryParams = [JSON.stringify(feature.geometry)];

            let paramIdx = 2;
            for (const cleanKey of cleanPropKeys) {
                const originalKey = propMap[cleanKey];
                colNames.push(`"${cleanKey}"`);
                colValues.push(`$${paramIdx}`);

                const val = props[originalKey];
                queryParams.push(val !== undefined && val !== null ? String(val) : null);
                paramIdx++;
            }

            await client.query(
                `INSERT INTO "${DB_SCHEMA}"."${tableName}" (${colNames.join(", ")}) VALUES (${colValues.join(", ")})`,
                queryParams
            );
        }

        await client.query(`CREATE INDEX ON "${DB_SCHEMA}"."${tableName}" USING GIST (the_geom);`);

        const bboxResult = await client.query(`
      SELECT 
        ST_XMin(ST_Extent(the_geom)) as minx,
        ST_YMin(ST_Extent(the_geom)) as miny,
        ST_XMax(ST_Extent(the_geom)) as maxx,
        ST_YMax(ST_Extent(the_geom)) as maxy
      FROM "${DB_SCHEMA}"."${tableName}";
    `);

        await client.query("COMMIT");

        const { minx, miny, maxx, maxy } = bboxResult.rows[0];

        const geoserverUrl = process.env.GEOSERVER_URL;
        const workspace = process.env.GEOSERVER_WORKSPACE;
        const existingDatastore = process.env.GEOSERVER_POSTGIS_DATASTORE;
        const auth = Buffer.from(`${process.env.GEOSERVER_USERNAME}:${process.env.GEOSERVER_PASSWORD}`).toString("base64");

        // --- PERBAIKAN UTAMA: definisikan attributes secara eksplisit ---
        // Ini menghindari GeoServer gagal auto-introspeksi kolom dari datastore,
        // yang jadi penyebab error "no attributes were specified"
        const attributesList = [
            {
                name: "the_geom",
                binding: "org.locationtech.jts.geom.Geometry",
            },
            ...cleanPropKeys.map((k) => ({
                name: k,
                binding: "java.lang.String",
            })),
        ];

        const publishBody = {
            featureType: {
                name: tableName,
                nativeName: tableName,
                title: layerNameInput,
                srs: "EPSG:4326",
                nativeCRS: "EPSG:4326",
                projectionPolicy: "FORCE_DECLARED",
                enabled: true,
                advertised: true,
                attributes: {
                    attribute: attributesList,
                },
                metadata: {
                    entry: [
                        { "@key": "disable.wfs.transactions", "$": (!isEditable).toString() }
                    ]
                },
                nativeBoundingBox: { minx: parseFloat(minx), maxx: parseFloat(maxx), miny: parseFloat(miny), maxy: parseFloat(maxy), crs: "EPSG:4326" },
                latLonBoundingBox: { minx: parseFloat(minx), maxx: parseFloat(maxx), miny: parseFloat(miny), maxy: parseFloat(maxy), crs: "EPSG:4326" }
            }
        };

        const publishUrl = `${geoserverUrl}/rest/workspaces/${workspace}/datastores/${existingDatastore}/featuretypes`;

        const publishResponse = await fetch(publishUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Basic ${auth}`,
            },
            body: JSON.stringify(publishBody),
        });

        if (!publishResponse.ok) {
            const publishErr = await publishResponse.text();
            throw new Error(`Gagal Publish ke GeoServer: ${publishErr}`);
        }

        await applyGeoServerLayerSecurity({
            geoserverUrl,
            workspace,
            tableName,
            akses,
            isEditable,
            auth,
        });

        const wmsUrl = `${geoserverUrl}/${workspace}/wms`;
        const wfsUrl = `${geoserverUrl}/${workspace}/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=${workspace}:${tableName}&outputFormat=application/json`;

        const newKatalogData = await db.katalog_data_2d.create({
            data: {
                data_2d_id: crypto.randomUUID(),
                layer_name: `${workspace}:${tableName}`,
                akses: akses,
                is_editable: isEditable,
                wms_url: wmsUrl,
                wfs_url: wfsUrl,
                author: payload.user_id,
            },
            select: {
                data_2d_id: true,
                layer_name: true,
                akses: true,
                is_editable: true,
                wms_url: true,
                wfs_url: true,
                users: {
                    select: {
                        email: true,
                    },
                },
            },
        });

        return NextResponse.json({
            success: true,
            message: `Layer ${layerNameInput} berhasil disimpan ke Katalog & GeoServer!`,
            data: newKatalogData,
        });
    } catch (error) {
        await client.query("ROLLBACK");
        // --- Rollback tambahan: hapus tabel PostGIS kalau publish GeoServer gagal ---
        // Mencegah tabel "yatim" yang sudah ter-commit tapi tidak pernah ter-publish
        try {
            await client.query(`DROP TABLE IF EXISTS "${DB_SCHEMA}"."${tableName}" CASCADE;`);
        } catch (dropErr) {
            console.error("Gagal membersihkan tabel setelah error:", dropErr);
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    } finally {
        client.release();
    }
}

async function applyGeoServerLayerSecurity({ geoserverUrl, workspace, tableName, akses, isEditable, auth }) {
    const readRoles = akses === "private" ? ["ADMIN"] : ["ROLE_ANONYMOUS", "ADMIN"];
    const writeRoles = isEditable ? ["ADMIN"] : [];
    const layerPattern = `${workspace}.${tableName}`;

    if (readRoles.length > 0) {
        await fetch(`${geoserverUrl}/rest/security/acl/layers`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Basic ${auth}`,
            },
            body: JSON.stringify({
                [`${layerPattern}.r`]: readRoles.join(","),
            }),
        });
    }

    if (writeRoles.length > 0) {
        await fetch(`${geoserverUrl}/rest/security/acl/layers`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Basic ${auth}`,
            },
            body: JSON.stringify({
                [`${layerPattern}.w`]: writeRoles.join(","),
            }),
        });
    }
}
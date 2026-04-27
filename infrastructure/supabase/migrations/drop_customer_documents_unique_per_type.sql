-- Autorise plusieurs fichiers du même type pour un client
-- (recto + verso d'un permis, deux pages d'un justif domicile, etc.).
--
-- Le UNIQUE INDEX initial (cf. add_customer_documents.sql) imposait
-- "1 fichier par type par client" et faisait échouer silencieusement les
-- imports multi-fichiers : la BDD rejetait les inserts au-delà du 1er.
--
-- Le remplacement (overwrite) n'est plus géré au niveau BDD — il l'est
-- côté application si vraiment nécessaire (suppression manuelle via UI).

DROP INDEX IF EXISTS uniq_customer_documents_customer_type;
